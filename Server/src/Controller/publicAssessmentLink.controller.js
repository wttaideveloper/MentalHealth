const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { AssessmentLink } = require("../model/AssessmentLink");
const { Test } = require("../model/Test");
const { TestAttempt } = require("../model/TestAttempt");
const { Result } = require("../model/Result");
const { computeScore } = require("../services/scoring.service");
const { evaluateRisk } = require("../services/risk.service");
const { checkEligibility } = require("../services/eligibility.service");

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
      maxAttempts: linkDoc.maxAttempts
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
      schemaJson: testDoc.schemaJson // Needed for rendering questions
    }
  });
});

/**
 * Start anonymous assessment attempt via link
 * Creates TestAttempt with linkToken (no userId required)
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
      message: eligibilityCheck.reason || "Not eligible for this assessment",
      eligibilityDetails: eligibilityCheck.details || []
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
    subscales: scoreResult.subscales,
    interpretation: {
      band: scoreResult.band,
      score: scoreResult.score,
      answeredCount: scoreResult.answeredCount,
      totalItems: scoreResult.totalItems,
      riskHelpText: riskResult.hasRisk ? riskResult.helpText : null
    },
    riskFlags: riskResult.flags
  });

  const resultData = resultDoc.toObject();

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

