const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const { Test } = require("../models/Test");
const { TestAttempt } = require("../models/TestAttempt");
const { Result } = require("../models/Result");

const { checkEligibility } = require("../services/eligibility.service");
const { computeScore } = require("../services/scoring.service");
const { evaluateRisk } = require("../services/risk.service");
const { writeAudit } = require("../services/audit.service");

exports.loadTest = asyncHandler(async (req, res, next) => {
  const testDoc = await Test.findById(req.params.testId);
  if (!testDoc) return res.status(404).json({ success: false, message: "Test not found" });
  req.test = testDoc;
  next();
});

exports.start = asyncHandler(async (req, res) => {
  const testDoc = req.test;
  const eligibility = checkEligibility(req.user, testDoc);
  if (!eligibility.ok) return res.status(403).json({ success: false, message: eligibility.reason });

  const nowDate = new Date();
  const timeLimitSeconds = Number(testDoc.timeLimitSeconds || 0);
  const expiresAt = timeLimitSeconds > 0 ? new Date(nowDate.getTime() + timeLimitSeconds * 1000) : null;

  const attemptDoc = await TestAttempt.create({
    userId: req.user._id,
    testId: testDoc._id,
    status: "in_progress",
    answers: {},
    startedAt: nowDate,
    timeLimitSeconds,
    expiresAt
  });

  await writeAudit({ userId: req.user._id, action: "TEST_STARTED", resourceType: "test", resourceId: String(testDoc._id), req });

  return created(res, "Attempt started", {
    attemptId: attemptDoc._id,
    schemaJson: testDoc.schemaJson,
    timeLimitSeconds,
    expiresAt
  });
});

exports.save = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answers } = req.body;

  const attemptDoc = await TestAttempt.findOne({ _id: attemptId, userId: req.user._id });
  if (!attemptDoc) return res.status(404).json({ success: false, message: "Attempt not found" });

  if (attemptDoc.status !== "in_progress") {
    return res.status(400).json({ success: false, message: "Attempt not in progress" });
  }

  if (attemptDoc.expiresAt && attemptDoc.expiresAt < new Date()) {
    attemptDoc.status = "expired";
    await attemptDoc.save();
    return res.status(400).json({ success: false, message: "Attempt expired" });
  }

  attemptDoc.answers = { ...(attemptDoc.answers || {}), ...(answers || {}) };
  attemptDoc.lastSavedAt = new Date();
  await attemptDoc.save();

  return ok(res, "Saved", { lastSavedAt: attemptDoc.lastSavedAt });
});

exports.submit = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  const attemptDoc = await TestAttempt.findOne({ _id: attemptId, userId: req.user._id });
  if (!attemptDoc) return res.status(404).json({ success: false, message: "Attempt not found" });

  if (attemptDoc.status !== "in_progress") {
    return res.status(400).json({ success: false, message: "Attempt already submitted/expired" });
  }

  if (attemptDoc.expiresAt && attemptDoc.expiresAt < new Date()) {
    attemptDoc.status = "expired";
    await attemptDoc.save();
    return res.status(400).json({ success: false, message: "Attempt expired" });
  }

  const testDoc = await Test.findById(attemptDoc.testId);
  if (!testDoc) return res.status(404).json({ success: false, message: "Test missing" });

  // scoring
  const scoringOut = computeScore(testDoc.scoringRules, attemptDoc.answers);

  // risk
  const riskOut = evaluateRisk(testDoc.riskRules, attemptDoc.answers);

  const interpretationObj = {
    summary: testDoc.scoringRules?.interpretation?.[scoringOut.band] || "",
    nextSteps: testDoc.scoringRules?.nextSteps || ""
  };

  const resultDoc = await Result.create({
    userId: req.user._id,
    testId: testDoc._id,
    attemptId: attemptDoc._id,
    score: scoringOut.score,
    band: scoringOut.band,
    subscales: scoringOut.subscales,
    interpretation: interpretationObj,
    riskFlags: riskOut.flags
  });

  attemptDoc.status = "submitted";
  attemptDoc.submittedAt = new Date();
  await attemptDoc.save();

  await writeAudit({ userId: req.user._id, action: "TEST_SUBMITTED", resourceType: "attempt", resourceId: String(attemptDoc._id), req });

  return ok(res, "Submitted", {
    resultId: resultDoc._id,
    score: resultDoc.score,
    band: resultDoc.band,
    interpretation: resultDoc.interpretation,
    risk: { hasRisk: riskOut.hasRisk, flags: riskOut.flags, helpText: riskOut.helpText }
  });
});
