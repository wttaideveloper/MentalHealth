const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { Test } = require("../model/Test");
const { TestAttempt } = require("../model/TestAttempt");
const { Result } = require("../model/Result");
const { GroupAssessment } = require("../model/GroupAssessment");
const { checkEligibility } = require("../services/eligibility.service");
const { computeScore } = require("../services/scoring.service");
const { evaluateRisk } = require("../services/risk.service");

/**
 * Get all ongoing attempts for the current user
 */
exports.listOngoing = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Find all in_progress attempts for the user
  const attempts = await TestAttempt.find({
    userId,
    status: "in_progress"
  })
    .populate("testId", "title shortDescription imageUrl durationMinutesMin durationMinutesMax questionsCount price")
    .sort({ startedAt: -1 })
    .lean();
  
  // Filter out expired attempts and update status if needed
  const validAttempts = [];
  const now = new Date();
  
  for (const attempt of attempts) {
    // Check if attempt has expired
    if (attempt.expiresAt && new Date(attempt.expiresAt) < now) {
      // Mark as expired
      await TestAttempt.findByIdAndUpdate(attempt._id, { status: "expired" });
      continue;
    }
    
    validAttempts.push(attempt);
  }
  
  return ok(res, "Ongoing attempts", validAttempts);
});

/**
 * Load test and check eligibility
 * This middleware loads the test and attaches it to req.test
 * Also checks eligibility and attaches result to req.eligibilityCheck
 */
exports.loadTest = asyncHandler(async (req, res, next) => {
  const { testId } = req.params;
  
  // Load test
  const testDoc = await Test.findById(testId);
  if (!testDoc) {
    return res.status(404).json({ success: false, message: "Test not found" });
  }
  
  if (!testDoc.isActive) {
    return res.status(400).json({ success: false, message: "Test is not active" });
  }
  
  // Attach test to request for use in subsequent middleware/controllers
  req.test = testDoc;
  
  // Check eligibility (only minAge supported)
  // Support participantInfo for anonymous users (from assessment links)
  const participantInfo = req.body?.participantInfo || null;
  
  try {
    const eligibilityCheck = checkEligibility(req.user, testDoc, participantInfo);
    req.eligibilityCheck = eligibilityCheck;
    
    if (!eligibilityCheck.ok) {
      console.log('Eligibility check failed:', {
        userId: req.user?._id,
        testId: testDoc._id,
        hasProfile: !!req.user?.profile,
        hasDob: !!req.user?.profile?.dob,
        participantInfo: participantInfo,
        rules: testDoc.eligibilityRules,
        reason: eligibilityCheck.reason
      });
      
      return res.status(400).json({ 
        success: false, 
        message: eligibilityCheck.reason || "Not eligible for this test"
      });
    }
  } catch (error) {
    console.error('Eligibility check error:', error);
    console.error('Error details:', {
      userId: req.user?._id,
      testId: testDoc?._id,
      userProfile: req.user?.profile,
      participantInfo: participantInfo
    });
    return res.status(500).json({ 
      success: false, 
      message: "Error checking eligibility. Please try again."
    });
  }
  
  next();
});

/**
 * Start a new test attempt
 * Creates a new TestAttempt document and returns it with test schema
 * Supports group assessment context via query params: groupAssessmentId and perspective
 */
exports.start = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const userId = req.user._id;
  const testDoc = req.test;
  const { groupAssessmentId, perspective } = req.query;
  
  // Validate perspective if groupAssessmentId is provided
  if (groupAssessmentId && !perspective) {
    return res.status(400).json({ 
      success: false, 
      message: "perspective is required when groupAssessmentId is provided" 
    });
  }
  
  // If group assessment context, verify it exists and user has access
  let groupAssessment = null;
  if (groupAssessmentId) {
    groupAssessment = await GroupAssessment.findById(groupAssessmentId)
      .populate("perspectives.userId");
    
    if (!groupAssessment) {
      return res.status(404).json({ 
        success: false, 
        message: "Group assessment not found" 
      });
    }
    
    if (!perspective) {
      return res.status(400).json({ 
        success: false, 
        message: "perspective is required when groupAssessmentId is provided" 
      });
    }
    
    // Find the perspective in the array
    const perspectiveObj = groupAssessment.perspectives.find(p => 
      p.perspectiveName === perspective
    );
    
    if (!perspectiveObj) {
      return res.status(404).json({ 
        success: false, 
        message: `Perspective "${perspective}" not found in this group assessment` 
      });
    }
    
    // Verify user is assigned to this perspective
    const perspectiveUserId = perspectiveObj.userId._id 
      ? perspectiveObj.userId._id 
      : perspectiveObj.userId;
    
    if (perspectiveUserId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not assigned to this perspective for this group assessment" 
      });
    }
    
    // Check if result already exists for this perspective
    if (perspectiveObj.resultId) {
      return res.status(400).json({ 
        success: false, 
        message: "Result already exists for this perspective in this group assessment" 
      });
    }
  }
  
  // Check if user already has an in_progress attempt for this test (and group assessment if applicable)
  const attemptFilter = {
    userId,
    testId,
    status: "in_progress"
  };
  
  if (groupAssessmentId) {
    attemptFilter.groupAssessmentId = groupAssessmentId;
    attemptFilter.perspective = perspective;
  }
  
  const existingAttempt = await TestAttempt.findOne(attemptFilter);
  
  if (existingAttempt) {
    // Return existing attempt instead of creating new one
    const attemptData = existingAttempt.toObject();
    return ok(res, "Existing attempt found", {
      attempt: attemptData,
      test: {
        _id: testDoc._id,
        title: testDoc.title,
        schemaJson: testDoc.schemaJson,
        timeLimitSeconds: testDoc.timeLimitSeconds,
        questionsCount: testDoc.questionsCount
      }
    });
  }
  
  // Calculate expiration time if time limit exists
  let expiresAt = null;
  if (testDoc.timeLimitSeconds > 0) {
    expiresAt = new Date(Date.now() + testDoc.timeLimitSeconds * 1000);
  }
  
  // Create new attempt
  const newAttempt = await TestAttempt.create({
    userId,
    testId,
    status: "in_progress",
    answers: {},
    startedAt: new Date(),
    timeLimitSeconds: testDoc.timeLimitSeconds || 0,
    expiresAt,
    groupAssessmentId: groupAssessmentId || null,
    perspective: perspective || "individual"
  });
  
  // Update group assessment status if applicable
  if (groupAssessment) {
    if (groupAssessment.status === "pending") {
      groupAssessment.status = "in_progress";
      await groupAssessment.save();
    }
  }
  
  const attemptData = newAttempt.toObject();
  
  // Return attempt with test schema (for frontend to render questions)
  return created(res, "Attempt started successfully", {
    attempt: attemptData,
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
 * Save/autosave attempt answers
 * Updates the answers and lastSavedAt timestamp
 */
exports.save = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answers } = req.body;
  const userId = req.user._id;
  
  // Find attempt and verify ownership
  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({ success: false, message: "Attempt not found" });
  }
  
  if (attempt.userId.toString() !== userId.toString()) {
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
 * Submit attempt (final submission)
 * Calculates score, evaluates risk, creates Result document
 * If answers are provided in body, they will be used (otherwise uses saved answers)
 */
exports.submit = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answers: submittedAnswers } = req.body;
  const userId = req.user._id;
  
  // Find attempt and verify ownership
  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({ success: false, message: "Attempt not found" });
  }
  
  if (attempt.userId.toString() !== userId.toString()) {
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
  
  // Debug logging for scoring rules
  if (process.env.NODE_ENV !== 'production') {
    console.log('Scoring Rules:', JSON.stringify(testDoc.scoringRules, null, 2));
    console.log('Score Result:', JSON.stringify(scoreResult, null, 2));
  }
  
  // Evaluate risk using risk service
  const riskResult = evaluateRisk(testDoc.riskRules, finalAnswers);
  
  // Mark attempt as submitted
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  attempt.lastSavedAt = new Date();
  await attempt.save();
  
  // Create result document
  const resultDoc = await Result.create({
    userId,
    testId: attempt.testId,
    attemptId: attempt._id,
    groupAssessmentId: attempt.groupAssessmentId || null,
    perspective: attempt.perspective || "individual",
    score: scoreResult.score,
    band: scoreResult.band,
    bandDescription: scoreResult.bandDescription,
    subscales: scoreResult.subscales,
    categoryResults: scoreResult.categoryResults ? Object.fromEntries(scoreResult.categoryResults) : {},
    interpretation: {
      band: scoreResult.band,
      score: scoreResult.score,
      answeredCount: scoreResult.answeredCount,
      totalItems: scoreResult.totalItems,
      riskHelpText: riskResult.hasRisk ? riskResult.helpText : null,
      categoryResults: scoreResult.categoryResults ? Object.fromEntries(scoreResult.categoryResults) : {}
    },
    riskFlags: riskResult.flags
  });
  
  // If this is part of a group assessment, update the group assessment
  if (attempt.groupAssessmentId && attempt.perspective) {
    const groupAssessment = await GroupAssessment.findById(attempt.groupAssessmentId);
    if (groupAssessment) {
      // Find and update the perspective in the array
      const perspectiveIndex = groupAssessment.perspectives.findIndex(p => 
        p.perspectiveName === attempt.perspective
      );
      
      if (perspectiveIndex !== -1) {
        groupAssessment.perspectives[perspectiveIndex].resultId = resultDoc._id;
        
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