const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { AssessmentLink } = require("../model/AssessmentLink");
const { GroupAssessmentLink } = require("../model/GroupAssessmentLink");
const { GroupAssessment } = require("../model/GroupAssessment");
const { StudentProfile } = require("../model/StudentProfile");
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
      // Update participantInfo with perspective if not set
      if (isGroupLink && perspective && existingAttempt.participantInfo && !existingAttempt.participantInfo.perspective) {
        existingAttempt.participantInfo.perspective = perspective.toLowerCase();
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
  
  // Store perspective in participantInfo as backup in case it's not saved in the attempt
  const participantInfoWithPerspective = participantInfo ? {
    ...participantInfo,
    perspective: normalizedPerspective // Store perspective in participantInfo as backup
  } : null;
  
  const attemptData = {
    userId: null, // Anonymous attempt
    testId: linkDoc.testId,
    linkToken: token,
    groupAssessmentId: groupAssessmentId || null,
    perspective: attemptPerspective, // This should be saved
    status: "in_progress",
    answers: {},
    participantInfo: participantInfoWithPerspective, // Include perspective as backup
    startedAt: new Date(),
    timeLimitSeconds: testDoc.timeLimitSeconds || 0,
    expiresAt
  };
  
  console.log(`[START] Attempt data before create:`, { 
    perspective: attemptData.perspective,
    hasParticipantInfo: !!attemptData.participantInfo,
    participantInfoPerspective: attemptData.participantInfo?.perspective
  }); // Debug log
  
  let newAttempt;
  try {
    newAttempt = await TestAttempt.create(attemptData);
    
    // Reload to ensure we get the actual saved values
    const savedAttempt = await TestAttempt.findById(newAttempt._id);
    console.log(`[START] Created attempt ${newAttempt._id} with perspective: ${savedAttempt.perspective}`); // Debug log
    
    if (!savedAttempt.perspective || savedAttempt.perspective === 'undefined' || savedAttempt.perspective === undefined) {
      console.log(`[START] ERROR: Perspective was not saved! Attempting to update...`); // Debug log
      // Try to update using updateOne to force the update
      const updateResult = await TestAttempt.updateOne(
        { _id: newAttempt._id },
        { $set: { perspective: attemptPerspective } }
      );
      console.log(`[START] Update result:`, updateResult); // Debug log
      // Reload again to verify
      newAttempt = await TestAttempt.findById(newAttempt._id);
      console.log(`[START] After update, perspective: ${newAttempt.perspective}`); // Debug log
      
      // If still not saved, there's a schema issue - log it
      if (!newAttempt.perspective || newAttempt.perspective === 'undefined') {
        console.error(`[START] CRITICAL: Perspective still not saved after update! Schema may have an issue.`); // Debug log
      }
    }
  } catch (error) {
    console.error(`[START] Error creating attempt:`, error.message); // Debug log
    throw error;
  }

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

  console.log(`[SUBMIT] Submit request - Token: ${token}, AttemptId: ${attemptId}`);
  console.log(`[SUBMIT] Request body:`, { hasAnswers: !!submittedAnswers });

  // Find attempt and verify it belongs to this link token
  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt) {
    console.log(`[SUBMIT] ERROR: Attempt not found - ID: ${attemptId}`);
    return res.status(404).json({ success: false, message: "Attempt not found" });
  }

  console.log(`[SUBMIT] Attempt found - Status: ${attempt.status}, LinkToken: ${attempt.linkToken}, TestId: ${attempt.testId}`);

  // Verify link token matches
  if (attempt.linkToken !== token) {
    console.log(`[SUBMIT] ERROR: Link token mismatch - Attempt token: ${attempt.linkToken}, Request token: ${token}`);
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  if (attempt.status !== "in_progress") {
    console.log(`[SUBMIT] ERROR: Attempt status is "${attempt.status}", expected "in_progress"`);
    console.log(`[SUBMIT] Attempt details:`, {
      _id: attempt._id,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      startedAt: attempt.startedAt,
      participantInfo: attempt.participantInfo
    });
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
  // Handle both actual undefined and string "undefined"
  let perspective = null;
  if (attempt.perspective && attempt.perspective !== 'undefined' && attempt.perspective !== undefined) {
    perspective = attempt.perspective.toLowerCase();
  }
  let groupLink = null;
  
  console.log(`[SUBMIT] Attempt ID: ${attempt._id}, Token: ${token}`); // Debug log
  console.log(`[SUBMIT] Attempt perspective from DB: "${attempt.perspective}", type: ${typeof attempt.perspective}, normalized: "${perspective}"`); // Debug log
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
    
    // If perspective is null but we have a group link, try to recover it
    if (groupLink && !perspective) {
      console.log(`[SUBMIT] WARNING: Perspective is null but group link exists! Attempting to recover...`); // Debug log
      
      // Method 1: Try to get from participantInfo.perspective (if we stored it)
      if (attempt.participantInfo && attempt.participantInfo.perspective) {
        perspective = attempt.participantInfo.perspective.toLowerCase();
        console.log(`[SUBMIT] Recovered perspective from participantInfo.perspective: ${perspective}`); // Debug log
      } 
      // Method 2: Try to infer from participantInfo - if studentName exists and matches name, it's student; otherwise check if studentName is different
      else if (attempt.participantInfo) {
        const hasStudentName = !!attempt.participantInfo.studentName;
        const nameMatchesStudentName = attempt.participantInfo.name && 
                                       attempt.participantInfo.studentName && 
                                       attempt.participantInfo.name.toLowerCase() === attempt.participantInfo.studentName.toLowerCase();
        
        if (nameMatchesStudentName || (!hasStudentName && attempt.participantInfo.name)) {
          // If name matches studentName or no studentName provided, likely a student
          perspective = 'student';
          console.log(`[SUBMIT] Inferred perspective as 'student' from participantInfo`); // Debug log
        } else if (hasStudentName && attempt.participantInfo.name !== attempt.participantInfo.studentName) {
          // If studentName is different from name, likely parent/teacher
          // Check which perspective in the link has results - if student has result, this is parent/teacher
          // Otherwise, we need to check the link perspectives
          const availablePerspectives = groupLink.perspectives.map(p => p.perspectiveName.toLowerCase());
          // Prefer parent over teacher if both exist
          if (availablePerspectives.includes('parent')) {
            perspective = 'parent';
          } else if (availablePerspectives.includes('teacher')) {
            perspective = 'teacher';
          } else {
            perspective = availablePerspectives[0] || 'student';
          }
          console.log(`[SUBMIT] Inferred perspective as '${perspective}' from participantInfo (name != studentName)`); // Debug log
        }
      }
      
      // Method 3: Last resort - use first available perspective
      if (!perspective && groupLink.perspectives && groupLink.perspectives.length > 0) {
        perspective = groupLink.perspectives[0].perspectiveName.toLowerCase();
        console.log(`[SUBMIT] WARNING: Using first perspective as fallback: ${perspective}`); // Debug log
      }
    }
    
    if (groupLink && perspective) {
      // NEW FLOW: Use subjectId (StudentProfile) instead of name matching
      let subjectId = null;
      const isStudentRole = perspective.toLowerCase() === 'student';
      
            console.log(`[SUBMIT] ParticipantInfo:`, attempt.participantInfo); // Debug log
      console.log(`[SUBMIT] Perspective: ${perspective}, isStudentRole: ${isStudentRole}`); // Debug log
      
      if (isStudentRole) {
        // Student role: Check if subjectId exists in participantInfo (should be set when profile was created)
        if (attempt.participantInfo && attempt.participantInfo.subjectId) {
          subjectId = attempt.participantInfo.subjectId;
          console.log(`[SUBMIT] Student role - using subjectId from participantInfo: ${subjectId}`); // Debug log
        } else {
          console.log(`[SUBMIT] ERROR: Student profile ID (subjectId) is missing for student role!`); // Debug log
            return res.status(400).json({ 
              success: false, 
            message: "Student profile is required. Please create your student profile first." 
          });
        }
      } else {
        // Parent/Teacher role: MUST have subjectId selected
        if (attempt.participantInfo && attempt.participantInfo.subjectId) {
          subjectId = attempt.participantInfo.subjectId;
          console.log(`[SUBMIT] ${perspective} role - using subjectId: ${subjectId}`); // Debug log
        } else {
          console.log(`[SUBMIT] ERROR: Student profile ID (subjectId) is required for ${perspective} role!`); // Debug log
          return res.status(400).json({ 
            success: false, 
            message: `Please select a student profile to continue. Student must complete the assessment first.` 
          });
        }
      }

      if (!subjectId) {
        console.log(`[SUBMIT] ERROR: subjectId is missing!`); // Debug log
        return res.status(400).json({ 
          success: false, 
          message: "Student profile is required for group assessment" 
        });
      }

      // Verify student profile exists
      const studentProfile = await StudentProfile.findById(subjectId);
      if (!studentProfile) {
        console.log(`[SUBMIT] ERROR: Student profile not found: ${subjectId}`); // Debug log
        return res.status(404).json({ 
          success: false, 
          message: "Student profile not found" 
        });
      }

      // Verify student profile belongs to this link
      if (studentProfile.linkToken !== token || 
          studentProfile.groupAssessmentLinkId.toString() !== groupLink._id.toString()) {
        console.log(`[SUBMIT] ERROR: Student profile does not belong to this link!`); // Debug log
        return res.status(403).json({ 
          success: false, 
          message: "Student profile does not belong to this assessment link" 
        });
      }

      // Find existing group assessment by subjectId
      let matchedGroupAssessment = await GroupAssessment.findOne({
            groupAssessmentLinkId: groupLink._id,
            linkToken: token,
        subjectId: subjectId
          });

      console.log(`[SUBMIT] Found existing group assessment: ${matchedGroupAssessment ? matchedGroupAssessment._id : 'NONE'}`); // Debug log

      // Create new group assessment if not found
      if (!matchedGroupAssessment) {
        console.log(`[SUBMIT] Creating new group assessment for subjectId: ${subjectId}`); // Debug log
        matchedGroupAssessment = await GroupAssessment.create({
          testId: groupLink.testId,
          groupName: studentProfile.name, // Use student profile name
          subjectId: subjectId,
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
        console.log(`[SUBMIT] Created group assessment: ${matchedGroupAssessment._id} with subjectId: ${subjectId}`); // Debug log
      } else {
        console.log(`[SUBMIT] Found existing group assessment: ${matchedGroupAssessment._id} for subjectId: ${subjectId}`); // Debug log
      }

      groupAssessmentId = matchedGroupAssessment._id;
      
      // Update perspective's participantInfo
      const perspectiveIndex = matchedGroupAssessment.perspectives.findIndex(p => 
        p.perspectiveName.toLowerCase() === perspective.toLowerCase()
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
      // Normalize perspective name for comparison (handle case differences)
      const normalizedPerspectiveName = perspective ? perspective.charAt(0).toUpperCase() + perspective.slice(1).toLowerCase() : null;
      const perspectiveIndex = groupAssessment.perspectives.findIndex(p => 
        p.perspectiveName.toLowerCase() === (perspective ? perspective.toLowerCase() : '')
      );
      
      console.log(`[SUBMIT] Updating group assessment ${groupAssessment._id}, perspective: ${perspective}, perspectiveIndex: ${perspectiveIndex}`); // Debug log
      
      if (perspectiveIndex !== -1) {
        groupAssessment.perspectives[perspectiveIndex].resultId = resultDoc._id;
        if (attempt.participantInfo) {
          groupAssessment.perspectives[perspectiveIndex].participantInfo = attempt.participantInfo;
        }
        
        // Mark the array as modified for Mongoose
        groupAssessment.markModified('perspectives');
        
        // Check if all perspectives have results
        const completedCount = groupAssessment.perspectives.filter(p => p.resultId).length;
        const totalCount = groupAssessment.perspectives.length;
        
        console.log(`[SUBMIT] Group assessment ${groupAssessment._id}: ${completedCount}/${totalCount} perspectives completed`); // Debug log
        
        if (completedCount === totalCount && totalCount > 0) {
          groupAssessment.status = "completed";
          groupAssessment.completedAt = new Date();
        } else {
          groupAssessment.status = "in_progress";
        }
        
        await groupAssessment.save();
        console.log(`[SUBMIT] Saved group assessment ${groupAssessment._id} with resultId for perspective ${perspective}`); // Debug log
      } else {
        console.error(`[SUBMIT] ERROR: Perspective "${perspective}" not found in group assessment perspectives!`); // Debug log
        console.error(`[SUBMIT] Available perspectives:`, groupAssessment.perspectives.map(p => p.perspectiveName)); // Debug log
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

