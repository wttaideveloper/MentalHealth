const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { Test } = require("../model/Test");
const { writeAudit } = require("../services/audit.service");
const { validateTestData } = require("../services/schemaValidation.service");

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
  // Filter by isActive status
  // Default behavior: only show active tests (exclude deleted tests)
  // "all" means show all tests (both active and inactive) - for admin to view deleted tests
  if (isActive === "false") {
    filter.isActive = false;
  } else if (isActive === "true") {
    filter.isActive = true;
  } else if (isActive === "all") {
    // Show all tests (both active and inactive) - no filter applied
    // This allows admin to see deleted tests when explicitly requested
  } else {
    // Default: show only active tests (exclude deleted tests) if parameter is not provided or invalid
    filter.isActive = true;
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

  // Validate schema and test data
  const validation = validateTestData(testData);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: "Schema validation failed",
      errors: validation.errors,
      warnings: validation.warnings
    });
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.log('Schema validation warnings:', validation.warnings);
  }

  // Debug: Log imageUrl if present
  if (testData.imageUrl) {
    console.log('Creating test with imageUrl:', testData.imageUrl);
  } else {
    console.log('Creating test without imageUrl (imageUrl is:', testData.imageUrl, ')');
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

  // Merge update data with existing test data for validation
  const mergedData = {
    ...testDoc.toObject(),
    ...updateData
  };

  // Validate schema and test data if schemaJson is being updated
  if (updateData.schemaJson || updateData.title) {
    const validation = validateTestData(mergedData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Schema validation failed",
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.log('Schema validation warnings:', validation.warnings);
    }
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

