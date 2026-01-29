const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { AssessmentLink } = require("../model/AssessmentLink");
const { GroupAssessmentLink } = require("../model/GroupAssessmentLink");
const { GroupAssessment } = require("../model/GroupAssessment");
const { Test } = require("../model/Test");
const { TestAttempt } = require("../model/TestAttempt");
const { Result } = require("../model/Result");
const { LinkPurchase } = require("../model/LinkPurchase");
const { computeScore } = require("../services/scoring.service");
const { evaluateRisk } = require("../services/risk.service");
const { checkEligibility } = require("../services/eligibility.service");
const { createRazorpayOrder } = require("../services/razorpay.service");
const { normalizeName, findBestMatch } = require("../utils/nameMatching.util");

/**
 * Validate assessment link token
 * Returns link info and test details if valid
 */
exports.validate = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Check both regular and group assessment links
  let linkDoc = await AssessmentLink.findOne({ linkToken: token });
  let isGroupLink = false;
  
  if (!linkDoc) {
    // Try group assessment link
    linkDoc = await GroupAssessmentLink.findOne({ linkToken: token });
    if (linkDoc) {
      isGroupLink = true;
    }
  }

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

  // Check if max attempts reached (for regular links)
  if (!isGroupLink && linkDoc.maxAttempts && linkDoc.currentAttempts >= linkDoc.maxAttempts) {
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

  // Prepare link response data
  const linkData = {
    _id: linkDoc._id,
    linkToken: linkDoc.linkToken,
    expiresAt: linkDoc.expiresAt,
    linkType: linkDoc.linkType || 'free',
    price: linkDoc.price || 0,
    isGroupAssessment: isGroupLink,
    testId: {
      _id: testDoc._id,
      title: testDoc.title,
      price: testDoc.price || 0
    }
  };

  // Add regular link specific fields
  if (!isGroupLink) {
    linkData.campaignName = linkDoc.campaignName;
    linkData.currentAttempts = linkDoc.currentAttempts;
    linkData.maxAttempts = linkDoc.maxAttempts;
  } else {
    // Add group link specific fields
    linkData.groupName = linkDoc.groupName;
    linkData.perspectives = linkDoc.perspectives || [];
  }

  // Return link and test info (include schemaJson for frontend, but not scoringRules/riskRules)
  return ok(res, "Link validated successfully", {
    link: linkData,
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
 * For group assessment links, requires perspective parameter
 */
exports.start = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { participantInfo, perspective } = req.body; // { name, email, dateOfBirth, gender }, perspective for group links

  // Check if this is a group assessment link
  const groupLinkDoc = await GroupAssessmentLink.findOne({ linkToken: token, isActive: true });
  let linkDoc = null;
  let isGroupLink = false;

  if (groupLinkDoc) {
    isGroupLink = true;
    linkDoc = groupLinkDoc;
    
    // For group links, perspective is required
    if (!perspective) {
      return res.status(400).json({ 
        success: false, 
        message: "Perspective is required for group assessment links" 
      });
    }

    // Normalize perspective for comparison (case-insensitive)
    const normalizedPerspectiveForCheck = perspective ? perspective.toLowerCase() : null;
    const perspectiveObj = groupLinkDoc.perspectives.find(p => 
      p.perspectiveName.toLowerCase() === normalizedPerspectiveForCheck
    );
    if (!perspectiveObj) {
      return res.status(400).json({ 
        success: false, 
        message: `Perspective "${perspective}" not found in this group assessment link` 
      });
    }

    // Check max attempts for this perspective
    if (perspectiveObj.maxAttempts && perspectiveObj.currentAttempts >= perspectiveObj.maxAttempts) {
      return res.status(400).json({ 
        success: false, 
        message: `Maximum attempts reached for perspective "${perspective}"` 
      });
    }
  } else {
    // Regular assessment link
    linkDoc = await AssessmentLink.findOne({ linkToken: token, isActive: true });
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
  }

  // Check expiration for group links
  if (isGroupLink && linkDoc.expiresAt && new Date() > linkDoc.expiresAt) {
    return res.status(400).json({ success: false, message: "Group assessment link has expired" });
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
  // For group links, check by perspective too
  const attemptFilter = {
    linkToken: token,
    status: "in_progress"
  };
  
  if (isGroupLink && perspective) {
    attemptFilter.perspective = perspective;
    attemptFilter.groupAssessmentId = null; // Will be set after group assessment is created
  }
  
  const existingAttempt = await TestAttempt.findOne(attemptFilter);

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

  // For group assessment links, we'll create/find group assessment in submit function
  // Here we just store the attempt with perspective info
  // Group assessment will be created/found during submit when student name is available
  let groupAssessmentId = null;

  // Normalize perspective to lowercase to match enum values
  const normalizedPerspective = perspective ? perspective.toLowerCase() : null;
  const attemptPerspective = (isGroupLink && normalizedPerspective) ? normalizedPerspective : "individual";
  console.log(`[START] Creating attempt with perspective: ${attemptPerspective}, isGroupLink: ${isGroupLink}, perspective param: ${perspective}, normalized: ${normalizedPerspective}`); // Debug log
  
  const newAttempt = await TestAttempt.create({
    userId: null, // Anonymous attempt
    testId: linkDoc.testId,
    linkToken: token,
    groupAssessmentId: groupAssessmentId || null,
    perspective: attemptPerspective,
    status: "in_progress",
    answers: {},
    participantInfo: participantInfo || null, // Store participant info
    startedAt: new Date(),
    timeLimitSeconds: testDoc.timeLimitSeconds || 0,
    expiresAt
  });
  
  console.log(`[START] Created attempt ${newAttempt._id} with perspective: ${newAttempt.perspective}`); // Debug log

  // Increment current attempts counter
  if (isGroupLink && perspective) {
    const perspectiveObj = groupLinkDoc.perspectives.find(p => p.perspectiveName === perspective);
    if (perspectiveObj) {
      perspectiveObj.currentAttempts += 1;
      await groupLinkDoc.save();
    }
  } else {
    linkDoc.currentAttempts += 1;
    await linkDoc.save();
  }

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

  // Check if this is a group assessment link attempt
  let groupAssessmentId = null;
  // Get perspective from attempt, normalize to handle any casing issues
  let perspective = attempt.perspective ? attempt.perspective.toLowerCase() : null;
  let groupLink = null;
  
  console.log(`[SUBMIT] Attempt ID: ${attempt._id}, Token: ${token}`); // Debug log
  console.log(`[SUBMIT] Attempt perspective from DB: "${attempt.perspective}", normalized: "${perspective}"`); // Debug log
  console.log(`[SUBMIT] Attempt groupAssessmentId: ${attempt.groupAssessmentId}`); // Debug log
  console.log(`[SUBMIT] Attempt participantInfo:`, attempt.participantInfo); // Debug log
  
  if (attempt.groupAssessmentId) {
    groupAssessmentId = attempt.groupAssessmentId;
    perspective = attempt.perspective ? attempt.perspective.toLowerCase() : null;
    console.log(`[SUBMIT] Using existing groupAssessmentId: ${groupAssessmentId}`); // Debug log
  } else {
    // Check if this link token belongs to a group assessment link
    groupLink = await GroupAssessmentLink.findOne({ linkToken: token });
    console.log(`[SUBMIT] Group link found: ${groupLink ? 'YES' : 'NO'}, Perspective: ${perspective}`); // Debug log
    console.log(`[SUBMIT] Group link details:`, groupLink ? {
      _id: groupLink._id,
      testId: groupLink.testId,
      perspectives: groupLink.perspectives?.map(p => p.perspectiveName)
    } : 'NONE'); // Debug log
    
    // If perspective is null but we have a group link, try to infer from participantInfo or use first perspective
    if (groupLink && !perspective) {
      console.log(`[SUBMIT] WARNING: Perspective is null but group link exists! Attempting to recover...`); // Debug log
      // Try to get perspective from participantInfo if available
      if (attempt.participantInfo && attempt.participantInfo.perspective) {
        perspective = attempt.participantInfo.perspective.toLowerCase();
        console.log(`[SUBMIT] Recovered perspective from participantInfo: ${perspective}`); // Debug log
      } else if (groupLink.perspectives && groupLink.perspectives.length > 0) {
        // Fallback: use first perspective (not ideal but better than failing)
        perspective = groupLink.perspectives[0].perspectiveName.toLowerCase();
        console.log(`[SUBMIT] WARNING: Using first perspective as fallback: ${perspective}`); // Debug log
      }
    }
    
    if (groupLink && perspective) {
      // Extract student name from participantInfo
      // For Student role: use their own name
      // For Parent/Teacher role: use studentName field from participantInfo
      let studentName = null;
      if (attempt.participantInfo) {
        if (perspective.toLowerCase() === 'student') {
          studentName = attempt.participantInfo.name || attempt.participantInfo.studentName;
        } else {
          // For Parent/Teacher, use studentName field
          studentName = attempt.participantInfo.studentName || attempt.participantInfo.name;
        }
      }

      console.log(`[SUBMIT] ParticipantInfo:`, attempt.participantInfo); // Debug log
      console.log(`[SUBMIT] Extracted studentName: ${studentName}`); // Debug log
      
      if (!studentName) {
        console.log(`[SUBMIT] ERROR: Student name is missing!`); // Debug log
        return res.status(400).json({ 
          success: false, 
          message: "Student name is required for group assessment" 
        });
      }

      // Normalize student name
      const normalizedStudentName = normalizeName(studentName);

      // Find existing group assessments for this link
      const existingGroupAssessments = await GroupAssessment.find({
        groupAssessmentLinkId: groupLink._id,
        linkToken: token
      }).select('normalizedStudentName groupName');

      // Use fuzzy matching to find best match
      let matchedGroupAssessment = null;
      console.log(`[SUBMIT] Found ${existingGroupAssessments.length} existing group assessments for this link`); // Debug log
      
      if (existingGroupAssessments.length > 0) {
        const existingNames = existingGroupAssessments
          .map(ga => ga.normalizedStudentName)
          .filter(name => name !== null);

        console.log(`[SUBMIT] Existing normalized names:`, existingNames); // Debug log
        const bestMatch = findBestMatch(normalizedStudentName, existingNames, 85);
        console.log(`[SUBMIT] Best match result:`, bestMatch); // Debug log
        
        if (bestMatch) {
          // Find the group assessment with the matched name
          matchedGroupAssessment = await GroupAssessment.findOne({
            groupAssessmentLinkId: groupLink._id,
            linkToken: token,
            normalizedStudentName: bestMatch.name
          });
          console.log(`[SUBMIT] Found matched group assessment: ${matchedGroupAssessment ? matchedGroupAssessment._id : 'NONE'}`); // Debug log
        }
      }

      // Create new group assessment if no match found
      if (!matchedGroupAssessment) {
        console.log(`Creating new group assessment for student: ${studentName} (normalized: ${normalizedStudentName})`); // Debug log
        matchedGroupAssessment = await GroupAssessment.create({
          testId: groupLink.testId,
          groupName: studentName, // Use actual student name as groupName
          normalizedStudentName: normalizedStudentName,
          createdBy: groupLink.createdBy,
          groupAssessmentLinkId: groupLink._id,
          linkToken: token,
          perspectives: groupLink.perspectives.map(p => ({
            perspectiveName: p.perspectiveName,
            userId: null, // Anonymous
            resultId: null,
            participantInfo: null
          })),
          status: "pending"
        });
        console.log(`Created group assessment: ${matchedGroupAssessment._id} with groupName: ${matchedGroupAssessment.groupName}`); // Debug log
      } else {
        console.log(`Found existing group assessment: ${matchedGroupAssessment._id} for student: ${studentName}`); // Debug log
      }

      groupAssessmentId = matchedGroupAssessment._id;
      
      // Update perspective's participantInfo
      const perspectiveIndex = matchedGroupAssessment.perspectives.findIndex(p => 
        p.perspectiveName === perspective
      );
      
      if (perspectiveIndex !== -1 && attempt.participantInfo) {
        matchedGroupAssessment.perspectives[perspectiveIndex].participantInfo = attempt.participantInfo;
        await matchedGroupAssessment.save();
      }
    }
  }

  // Convert categoryResults to plain object if it's a Map
  let categoryResultsObj = {};
  if (scoreResult.categoryResults) {
    if (scoreResult.categoryResults instanceof Map) {
      categoryResultsObj = Object.fromEntries(scoreResult.categoryResults);
    } else if (typeof scoreResult.categoryResults === 'object') {
      categoryResultsObj = scoreResult.categoryResults;
    }
  }

      console.log(`[SUBMIT] Creating result with groupAssessmentId: ${groupAssessmentId}, perspective: ${perspective}`); // Debug log
      
      // Create result document (with null userId for anonymous)
      const resultDoc = await Result.create({
        userId: null, // Anonymous result
        testId: attempt.testId,
        attemptId: attempt._id,
        linkToken: token,
        groupAssessmentId: groupAssessmentId || null,
        perspective: perspective || "individual",
    score: scoreResult.score,
    band: scoreResult.band,
    bandDescription: scoreResult.bandDescription,
    subscales: scoreResult.subscales,
    categoryResults: categoryResultsObj,
    interpretation: {
      band: scoreResult.band,
      score: scoreResult.score,
      answeredCount: scoreResult.answeredCount,
      totalItems: scoreResult.totalItems,
      riskHelpText: riskResult.hasRisk ? riskResult.helpText : null,
      categoryResults: categoryResultsObj
    },
    riskFlags: riskResult.flags
  });

  // If this is part of a group assessment, update the group assessment
  if (groupAssessmentId && perspective) {
    const groupAssessment = await GroupAssessment.findById(groupAssessmentId);
    if (groupAssessment) {
      // Find and update the perspective in the array
      const perspectiveIndex = groupAssessment.perspectives.findIndex(p => 
        p.perspectiveName === perspective
      );
      
      if (perspectiveIndex !== -1) {
        groupAssessment.perspectives[perspectiveIndex].resultId = resultDoc._id;
        if (attempt.participantInfo) {
          groupAssessment.perspectives[perspectiveIndex].participantInfo = attempt.participantInfo;
        }
        
        // Check if all perspectives have results
        const completedCount = groupAssessment.perspectives.filter(p => p.resultId).length;
        const totalCount = groupAssessment.perspectives.length;
        
        if (completedCount === totalCount && totalCount > 0) {
          groupAssessment.status = "completed";
          groupAssessment.completedAt = new Date();
        } else {
          groupAssessment.status = "in_progress";
        }
        
        await groupAssessment.save();
      }
    }

    // Update group assessment link attempt counter
    if (groupLink) {
      const perspectiveObj = groupLink.perspectives.find(p => p.perspectiveName === perspective);
      if (perspectiveObj) {
        perspectiveObj.currentAttempts += 1;
        await groupLink.save();
      }
    }
  }

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

/**
 * Get student name suggestions for auto-complete
 * GET /api/public/assessment-links/:token/student-suggestions?q=bal
 */
exports.getStudentNameSuggestions = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { q } = req.query;

  if (!q || q.length < 2) {
    return ok(res, "Suggestions", []);
  }

  // Find the group assessment link
  const groupLink = await GroupAssessmentLink.findOne({ linkToken: token, isActive: true });
  if (!groupLink) {
    return ok(res, "Suggestions", []);
  }

  // Get all existing group assessments for this link
  const existingGroupAssessments = await GroupAssessment.find({
    groupAssessmentLinkId: groupLink._id,
    linkToken: token,
    normalizedStudentName: { $exists: true, $ne: null }
  }).select('groupName normalizedStudentName').lean();

  // Extract unique student names
  const studentNames = [...new Set(
    existingGroupAssessments
      .map(ga => ga.groupName)
      .filter(name => name)
  )];

  // Use fuzzy matching to get suggestions
  const { getSuggestions } = require("../utils/nameMatching.util");
  const suggestions = getSuggestions(q, studentNames, 50, 5);

  return ok(res, "Suggestions", suggestions.map(s => ({
    name: s.name,
    similarity: s.similarity
  })));
});

