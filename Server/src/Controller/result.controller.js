const { asyncHandler } = require("../utils/asyncHandler");
const { ok } = require("../utils/response");
const { Result } = require("../models/Result");

exports.list = asyncHandler(async (req, res) => {
  const { testId } = req.query;
  const filter = { userId: req.user._id };
  if (testId) filter.testId = testId;

  const items = await Result.find(filter).sort({ createdAt: -1 }).populate("testId", "title category");
  return ok(res, "Results", items);
});

exports.getById = asyncHandler(async (req, res) => {
  const resultDoc = await Result.findOne({ _id: req.params.resultId, userId: req.user._id }).populate("testId", "title category");
  if (!resultDoc) return res.status(404).json({ success: false, message: "Result not found" });
  return ok(res, "Result", resultDoc);
});

exports.trends = asyncHandler(async (req, res) => {
  const { testId } = req.query;
  const match = { userId: req.user._id };
  if (testId) match.testId = require("mongoose").Types.ObjectId.createFromHexString(testId);

  const agg = await Result.aggregate([
    { $match: match },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        avgScore: { $avg: "$score" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  return ok(res, "Trends", agg);
});
