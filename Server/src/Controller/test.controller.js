const { asyncHandler } = require("../utils/Asynchandler");
const { ok } = require("../utils/Response");
const { Test } = require("../model/Test");

exports.list = asyncHandler(async (req, res) => {
  const { q, category, free, popularity } = req.query;
  const filter = { isActive: true };

  if (q) filter.title = { $regex: q, $options: "i" };
  if (category) filter.category = category;
  if (free === "true") filter.price = 0;

  const sortObj = popularity === "true" ? { popularityScore: -1 } : { createdAt: -1 };

  const testsList = await Test.find(filter).sort(sortObj).select("-schemaJson -scoringRules -riskRules");
  return ok(res, "Tests", testsList);
});

exports.getById = asyncHandler(async (req, res) => {
  const testDoc = await Test.findById(req.params.testId);
  if (!testDoc) {
    return res.status(404).json({ success: false, message: "Test not found" });
  }
  
  // Return full test data (including schemaJson, scoringRules, riskRules)
  // These are needed when user is taking the test
  return ok(res, "Test", testDoc);
});
