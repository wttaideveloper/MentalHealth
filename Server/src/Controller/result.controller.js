const { asyncHandler } = require("../utils/Asynchandler");
const { ok } = require("../utils/Response");
const { Result } = require("../model/Result");
const { Test } = require("../model/Test");
const { TestAttempt } = require("../model/TestAttempt");

/**
 * Get all results for the authenticated user
 * Returns results with test details populated
 */
exports.list = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { testId, limit, skip } = req.query;
  
  const filter = { userId };
  
  // Optional filter by testId
  if (testId) {
    filter.testId = testId;
  }
  
  // Build query
  let query = Result.find(filter)
    .populate("testId", "title category shortDescription imageUrl questionsCount")
    .populate("attemptId", "startedAt submittedAt")
    .sort({ createdAt: -1 }); // Most recent first
  
  // Apply pagination if provided
  const limitNum = limit ? parseInt(limit, 10) : null;
  const skipNum = skip ? parseInt(skip, 10) : null;
  
  if (skipNum) query = query.skip(skipNum);
  if (limitNum) query = query.limit(limitNum);
  
  const results = await query;
  
  return ok(res, "Results retrieved successfully", results);
});

/**
 * Get a single result by ID with full details
 * Includes result, attempt, test, and all related data
 */
exports.getById = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const userId = req.user._id;
  
  const result = await Result.findById(resultId)
    .populate("testId")
    .populate("attemptId")
    .populate("userId", "firstName lastName email");
  
  if (!result) {
    return res.status(404).json({ success: false, message: "Result not found" });
  }
  
  // Verify ownership
  // When populated, result.userId is a document, otherwise it's an ObjectId
  const resultUserId = result.userId._id ? result.userId._id : result.userId;
  if (resultUserId.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  
  const resultData = result.toObject();
  
  return ok(res, "Result retrieved successfully", resultData);
});

/**
 * Get trend data for user's results
 * Optional: Returns aggregated data for analysis (e.g., score trends over time)
 */
exports.trends = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { testId } = req.query;
  
  const filter = { userId };
  if (testId) {
    filter.testId = testId;
  }
  
  // Get all results with populated test data
  const results = await Result.find(filter)
    .populate("testId", "title")
    .sort({ createdAt: 1 }); // Oldest first for trends
  
  // Group by test for trend analysis
  const trendsByTest = {};
  
  results.forEach(result => {
    const testIdStr = result.testId._id.toString();
    const testTitle = result.testId.title;
    
    if (!trendsByTest[testIdStr]) {
      trendsByTest[testIdStr] = {
        testId: result.testId._id,
        testTitle,
        results: []
      };
    }
    
    trendsByTest[testIdStr].results.push({
      resultId: result._id,
      score: result.score,
      band: result.band,
      createdAt: result.createdAt,
      subscales: result.subscales
    });
  });
  
  // Convert to array format
  const trends = Object.values(trendsByTest);
  
  return ok(res, "Trends retrieved successfully", {
    trends,
    totalResults: results.length
  });
});