const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { Test } = require("../model/Test");
const { writeAudit } = require("../services/audit.service");

/**
 * Get all tests including inactive (admin only)
 */
exports.listAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = "", isActive = "" } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } }
    ];
  }
  if (isActive === "true") {
    filter.isActive = true;
  } else if (isActive === "false") {
    filter.isActive = false;
  }

  const [tests, total] = await Promise.all([
    Test.find(filter)
      .select("-schemaJson -scoringRules -riskRules")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Test.countDocuments(filter)
  ]);

  return ok(res, "Tests list", {
    tests,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * Get test by ID (admin only - includes all fields)
 */
exports.getById = asyncHandler(async (req, res) => {
  const testDoc = await Test.findById(req.params.testId);
  
  if (!testDoc) {
    return res.status(404).json({ success: false, message: "Test not found" });
  }

  return ok(res, "Test", testDoc);
});

/**
 * Create new test (admin only)
 */
exports.create = asyncHandler(async (req, res) => {
  const testData = req.body;

  // Validate required fields
  if (!testData.title || !testData.schemaJson) {
    return res.status(400).json({ success: false, message: "Title and schemaJson are required" });
  }

  const newTest = await Test.create(testData);

  await writeAudit({ userId: req.user._id, action: "ADMIN_CREATE_TEST", resourceType: "test", resourceId: String(newTest._id), req });

  return created(res, "Test created", newTest);
});

/**
 * Update test (admin only)
 */
exports.update = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const updateData = req.body;

  const testDoc = await Test.findById(testId);
  if (!testDoc) {
    return res.status(404).json({ success: false, message: "Test not found" });
  }

  // Update fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      testDoc[key] = updateData[key];
    }
  });

  await testDoc.save();

  await writeAudit({ userId: req.user._id, action: "ADMIN_UPDATE_TEST", resourceType: "test", resourceId: testId, req });

  return ok(res, "Test updated", testDoc);
});

/**
 * Delete test (admin only) - Soft delete by setting isActive to false
 */
exports.delete = asyncHandler(async (req, res) => {
  const { testId } = req.params;

  const testDoc = await Test.findById(testId);
  if (!testDoc) {
    return res.status(404).json({ success: false, message: "Test not found" });
  }

  // Soft delete
  testDoc.isActive = false;
  await testDoc.save();

  await writeAudit({ userId: req.user._id, action: "ADMIN_DELETE_TEST", resourceType: "test", resourceId: testId, req });

  return ok(res, "Test deleted", testDoc);
});

