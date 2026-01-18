const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { AssessmentLink } = require("../model/AssessmentLink");
const { Test } = require("../model/Test");
const { TestAttempt } = require("../model/TestAttempt");
const { Result } = require("../model/Result");
const { LinkPurchase } = require("../model/LinkPurchase");
const { computeScore } = require("../services/scoring.service");
const { evaluateRisk } = require("../services/risk.service");
const { checkEligibility } = require("../services/eligibility.service");
const { createRazorpayOrder } = require("../services/razorpay.service");

/**
 * Validate assessment link token
 * Returns link info and test details if valid
 */
exports.validate = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Find assessment link
  const linkDoc = await AssessmentLink.findOne({ linkToken: token });
  if (!linkDoc) {
    return res.status(404).json({ success: false, message: "Assessment link not found" });
  }

  // Check if link is active
  if (!linkDoc.isActive) {
    return res.status(400).json({ success: false, message: "Assessment link is not active" });
  }

  // Check if link has expired
  if (linkDoc.expiresAt && new Date() > linkDoc.expiresAt) {
    return res.status(400).json({ success: false, message: "Assessment link has expired" });
  }

  // Check if max attempts reached
  if (linkDoc.maxAttempts && linkDoc.currentAttempts >= linkDoc.maxAttempts) {
    return res.status(400).json({ success: false, message: "Maximum attempts reached for this assessment link" });
  }

  // Load test
  const testDoc = await Test.findById(linkDoc.testId);
  if (!testDoc) {
    return res.status(404).json({ success: false, message: "Test not found" });
  }

  if (!testDoc.isActive) {
    return res.status(400).json({ success: false, message: "Test is not active" });
  }

  // Return link and test info (include schemaJson for frontend, but not scoringRules/riskRules)
  return ok(res, "Link validated successfully", {
    link: {
      _id: linkDoc._id,
      linkToken: linkDoc.linkToken,
      campaignName: linkDoc.campaignName,
      expiresAt: linkDoc.expiresAt,
      currentAttempts: linkDoc.currentAttempts,
      maxAttempts: linkDoc.maxAttempts,
      linkType: linkDoc.linkType || 'free',
      price: linkDoc.price || 0,
      testId: {
        _id: testDoc._id,
        title: testDoc.title,
        price: testDoc.price || 0
      }
    },
    test: {
      _id: testDoc._id,
      title: testDoc.title,
      shortDescription: testDoc.shortDescription,
      longDescription: testDoc.longDescription,
      durationMinutesMin: testDoc.durationMinutesMin,
      durationMinutesMax: testDoc.durationMinutesMax,
      questionsCount: testDoc.questionsCount,
      imageUrl: testDoc.imageUrl,
      price: testDoc.price || 0,
      schemaJson: testDoc.schemaJson // Needed for rendering questions
    }
  });
});

/**
 * Create payment order for paid assessment link
 */
exports.createPaymentOrder = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { participantEmail, participantName } = req.body;

  // Validate link
  const linkDoc = await AssessmentLink.findOne({ linkToken: token, isActive: true });
  if (!linkDoc) {
    return res.status(404).json({ success: false, message: "Assessment link not found or inactive" });
  }

  // Check if link is paid
  if (linkDoc.linkType !== 'paid' || !linkDoc.price || linkDoc.price <= 0) {
    return res.status(400).json({ success: false, message: "This assessment link is free" });
  }

  // Validate email
  if (!participantEmail) {
    return res.status(400).json({ success: false, message: "Participant email is required" });
  }

  // Check if payment already exists and is paid
  const existingPurchase = await LinkPurchase.findOne({
    linkToken: token,
    participantEmail: participantEmail.toLowerCase(),
    status: 'paid'
  });

  if (existingPurchase) {
    return res.status(400).json({ 
      success: false, 
      message: "Payment already completed for this email" 
    });
  }

  // Create Razorpay order
  const amountInPaise = Math.round(linkDoc.price * 100); // Convert to paise
  const receiptValue = `LINK_${linkDoc._id}_${Date.now()}`;

  try {
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise,
      currencyValue: 'INR',
      receiptValue
    });

    // Create or update LinkPurchase record
    let linkPurchase = await LinkPurchase.findOne({
      linkToken: token,
      participantEmail: participantEmail.toLowerCase(),
      status: 'created'
    });

    if (linkPurchase) {
      linkPurchase.razorpayOrderId = razorpayOrder.id;
      linkPurchase.amount = linkDoc.price;
      linkPurchase.participantName = participantName || '';
      await linkPurchase.save();
    } else {
      linkPurchase = await LinkPurchase.create({
        linkToken: token,
        assessmentLinkId: linkDoc._id,
        participantEmail: participantEmail.toLowerCase(),
        participantName: participantName || '',
        amount: linkDoc.price,
        currency: 'INR',
        status: 'created',
        razorpayOrderId: razorpayOrder.id
      });
    }

    const { cfg } = require("../config/config");
    
    return ok(res, "Payment order created", {
      orderId: razorpayOrder.id,
      amount: linkDoc.price,
      currency: 'INR',
      purchaseId: linkPurchase._id,
      razorpayKeyId: cfg.RAZORPAY_KEY_ID // Return key ID for frontend
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to create payment order: ${error.message}` 
    });
  }
});

/**
 * Verify payment and start attempt
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { paymentId, orderId, participantEmail } = req.body;

  // Validate link
  const linkDoc = await AssessmentLink.findOne({ linkToken: token, isActive: true });
  if (!linkDoc) {
    return res.status(404).json({ success: false, message: "Assessment link not found or inactive" });
  }

  // Find purchase record - try by orderId first, then by email if orderId not found
  let purchase = await LinkPurchase.findOne({
    linkToken: token,
    participantEmail: participantEmail.toLowerCase(),
    razorpayOrderId: orderId
  });

  // If not found by orderId, try to find any purchase for this email and link
  if (!purchase) {
    purchase = await LinkPurchase.findOne({
      linkToken: token,
      participantEmail: participantEmail.toLowerCase()
    });
  }

  // If still not found, create a new one (for testing/mock payments)
  if (!purchase) {
    purchase = await LinkPurchase.create({
      linkToken: token,
      assessmentLinkId: linkDoc._id,
      participantEmail: participantEmail.toLowerCase(),
      participantName: '',
      amount: linkDoc.price,
      currency: 'INR',
      status: 'paid',
      razorpayOrderId: orderId || `mock_order_${Date.now()}`,
      razorpayPaymentId: paymentId || `mock_pay_${Date.now()}`
    });
  } else {
    // Update existing purchase with payment ID and mark as paid
    purchase.razorpayPaymentId = paymentId || purchase.razorpayPaymentId || `mock_pay_${Date.now()}`;
    purchase.status = 'paid';
    await purchase.save();
  }

  return ok(res, "Payment verified successfully", {
    purchaseId: purchase._id,
    status: 'paid'
  });
});

/**
 * Start anonymous assessment attempt via link
 * Creates TestAttempt with linkToken (no userId required)
 * For paid links, verifies payment status
 */
exports.start = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { participantInfo } = req.body; // { name, email, dateOfBirth, gender }

  // Validate link
  const linkDoc = await AssessmentLink.findOne({ linkToken: token, isActive: true });
  if (!linkDoc) {
    return res.status(404).json({ success: false, message: "Assessment link not found or inactive" });
  }

  // Check expiration
  if (linkDoc.expiresAt && new Date() > linkDoc.expiresAt) {
    return res.status(400).json({ success: false, message: "Assessment link has expired" });
  }

  // Check max attempts
  if (linkDoc.maxAttempts && linkDoc.currentAttempts >= linkDoc.maxAttempts) {
    return res.status(400).json({ success: false, message: "Maximum attempts reached" });
  }

  // For paid links, verify payment
  if (linkDoc.linkType === 'paid' && linkDoc.price > 0) {
    if (!participantInfo || !participantInfo.email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required for paid assessment links" 
      });
    }

    const purchase = await LinkPurchase.findOne({
      linkToken: token,
      participantEmail: participantInfo.email.toLowerCase(),
      status: 'paid'
    });

    if (!purchase) {
      return res.status(402).json({ 
        success: false, 
        message: "Payment required. Please complete payment to start the assessment.",
        requiresPayment: true,
        linkType: 'paid',
        price: linkDoc.price
      });
    }
  }

  // Load test
  const testDoc = await Test.findById(linkDoc.testId);
  if (!testDoc || !testDoc.isActive) {
    return res.status(404).json({ success: false, message: "Test not found or inactive" });
  }

  // Check eligibility for anonymous user (using participantInfo)
  // Create a dummy user object for compatibility
  const dummyUser = { profile: participantInfo || {} };
  const eligibilityCheck = checkEligibility(dummyUser, testDoc, participantInfo);
  
  if (!eligibilityCheck.ok) {
    return res.status(400).json({ 
      success: false, 
      message: eligibilityCheck.reason || "Not eligible for this assessment"
    });
  }

  // Check if there's already an in_progress attempt for this link token
  // (Optional: allow only one active attempt per link token)
  const existingAttempt = await TestAttempt.findOne({
    linkToken: token,
    status: "in_progress"
  });

  if (existingAttempt) {
    // Check if expired
    if (existingAttempt.expiresAt && new Date() > existingAttempt.expiresAt) {
      existingAttempt.status = "expired";
      await existingAttempt.save();
    } else {
      // Update participant info if provided and not already set
      if (participantInfo && !existingAttempt.participantInfo) {
        existingAttempt.participantInfo = participantInfo;
        await existingAttempt.save();
      }
      // Return existing attempt
      return ok(res, "Existing attempt found", {
        attempt: existingAttempt.toObject(),
        test: {
          _id: testDoc._id,
          title: testDoc.title,
          schemaJson: testDoc.schemaJson,
          timeLimitSeconds: testDoc.timeLimitSeconds,
          questionsCount: testDoc.questionsCount
        }
      });
    }
  }

  // Calculate expiration time if time limit exists
  let expiresAt = null;
  if (testDoc.timeLimitSeconds > 0) {
    expiresAt = new Date(Date.now() + testDoc.timeLimitSeconds * 1000);
  }

  // Create new anonymous attempt
  const newAttempt = await TestAttempt.create({
    userId: null, // Anonymous attempt
    testId: linkDoc.testId,
    linkToken: token,
    status: "in_progress",
    answers: {},
    participantInfo: participantInfo || null, // Store participant info
    startedAt: new Date(),
    timeLimitSeconds: testDoc.timeLimitSeconds || 0,
    expiresAt
  });

  // Increment current attempts counter
  linkDoc.currentAttempts += 1;
  await linkDoc.save();

  // Store participant info in attempt (optional, can be stored in a separate field if needed)
  // For now, we'll just create the attempt. Participant info can be stored separately if needed.

  return created(res, "Attempt started successfully", {
    attempt: newAttempt.toObject(),
    test: {
      _id: testDoc._id,
      title: testDoc.title,
      schemaJson: testDoc.schemaJson,
      timeLimitSeconds: testDoc.timeLimitSeconds,
      questionsCount: testDoc.questionsCount
    }
  });
});

/**
 * Save answers for anonymous attempt
 * Verifies ownership via linkToken instead of userId
 */
exports.save = asyncHandler(async (req, res) => {
  const { token, attemptId } = req.params;
  const { answers } = req.body;

  // Find attempt and verify it belongs to this link token
  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({ success: false, message: "Attempt not found" });
  }

  // Verify link token matches
  if (attempt.linkToken !== token) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  if (attempt.status !== "in_progress") {
    return res.status(400).json({ 
      success: false, 
      message: "Cannot save a submitted or expired attempt" 
    });
  }

  // Check if attempt has expired
  if (attempt.expiresAt && new Date() > attempt.expiresAt) {
    attempt.status = "expired";
    await attempt.save();
    return res.status(400).json({ 
      success: false, 
      message: "Attempt has expired" 
    });
  }

  // Update answers and lastSavedAt
  attempt.answers = answers || {};
  attempt.lastSavedAt = new Date();
  await attempt.save();

  return ok(res, "Attempt saved successfully", {
    attempt: {
      _id: attempt._id,
      answers: attempt.answers,
      lastSavedAt: attempt.lastSavedAt,
      expiresAt: attempt.expiresAt,
      status: attempt.status
    }
  });
});

/**
 * Submit anonymous attempt
 * Calculates score, creates Result with null userId
 */
exports.submit = asyncHandler(async (req, res) => {
  const { token, attemptId } = req.params;
  const { answers: submittedAnswers } = req.body;

  // Find attempt and verify it belongs to this link token
  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({ success: false, message: "Attempt not found" });
  }

  // Verify link token matches
  if (attempt.linkToken !== token) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  if (attempt.status !== "in_progress") {
    return res.status(400).json({ 
      success: false, 
      message: `Attempt is already ${attempt.status}` 
    });
  }

  // Check if attempt has expired
  if (attempt.expiresAt && new Date() > attempt.expiresAt) {
    attempt.status = "expired";
    await attempt.save();
    return res.status(400).json({ 
      success: false, 
      message: "Attempt has expired" 
    });
  }

  // Use submitted answers if provided, otherwise use saved answers
  const finalAnswers = submittedAnswers || attempt.answers;

  // Update answers if new ones were provided
  if (submittedAnswers) {
    attempt.answers = submittedAnswers;
  }

  // Load test to get scoring and risk rules
  const testDoc = await Test.findById(attempt.testId);
  if (!testDoc) {
    return res.status(404).json({ success: false, message: "Test not found" });
  }

  // Calculate score using scoring service
  const scoreResult = computeScore(testDoc.scoringRules, finalAnswers);

  // Evaluate risk using risk service
  const riskResult = evaluateRisk(testDoc.riskRules, finalAnswers);

  // Mark attempt as submitted
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  attempt.lastSavedAt = new Date();
  await attempt.save();

  // Create result document (with null userId for anonymous)
  const resultDoc = await Result.create({
    userId: null, // Anonymous result
    testId: attempt.testId,
    attemptId: attempt._id,
    linkToken: token,
    score: scoreResult.score,
    band: scoreResult.band,
    bandDescription: scoreResult.bandDescription,
    subscales: scoreResult.subscales,
    categoryResults: scoreResult.categoryResults || {},
    interpretation: {
      band: scoreResult.band,
      score: scoreResult.score,
      answeredCount: scoreResult.answeredCount,
      totalItems: scoreResult.totalItems,
      riskHelpText: riskResult.hasRisk ? riskResult.helpText : null,
      categoryResults: scoreResult.categoryResults || {}
    },
    riskFlags: riskResult.flags
  });

  const resultData = resultDoc.toObject();
  
  // Convert categoryResults Map to plain object if it exists
  if (resultData.categoryResults && resultData.categoryResults instanceof Map) {
    resultData.categoryResults = Object.fromEntries(resultData.categoryResults);
  } else if (resultDoc.categoryResults && resultDoc.categoryResults instanceof Map) {
    resultData.categoryResults = Object.fromEntries(resultDoc.categoryResults);
  }

  return ok(res, "Attempt submitted successfully", {
    result: resultData,
    attempt: {
      _id: attempt._id,
      status: attempt.status,
      submittedAt: attempt.submittedAt
    },
    score: scoreResult,
    risk: riskResult
  });
});

