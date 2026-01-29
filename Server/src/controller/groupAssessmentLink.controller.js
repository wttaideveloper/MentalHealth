const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { GroupAssessmentLink } = require("../model/GroupAssessmentLink");
const { GroupAssessment } = require("../model/GroupAssessment");
const { Test } = require("../model/Test");
const crypto = require("crypto");

/**
 * Create a new group assessment link
 * POST /api/admin/group-assessment-links
 */
exports.create = asyncHandler(async (req, res) => {
  const { testId, groupName, perspectives, expiresAt, notes } = req.body;
  const createdBy = req.user._id;

  // Validate required fields
  if (!testId || !groupName) {
    return res.status(400).json({ 
      success: false, 
      message: "testId and groupName are required" 
    });
  }

  // Validate perspectives array
  if (!perspectives || !Array.isArray(perspectives) || perspectives.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "At least one perspective is required" 
    });
  }

  // Verify test exists
  const test = await Test.findById(testId);
  if (!test) {
    return res.status(404).json({ 
      success: false, 
      message: "Test not found" 
    });
  }

  // Validate perspectives
  const validatedPerspectives = [];
  for (const perspective of perspectives) {
    if (!perspective.perspectiveName) {
      return res.status(400).json({ 
        success: false, 
        message: "Each perspective must have a perspectiveName" 
      });
    }
    validatedPerspectives.push({
      perspectiveName: perspective.perspectiveName.trim(),
      maxAttempts: perspective.maxAttempts || null,
      currentAttempts: 0
    });
  }

  // Generate unique link token
  const linkToken = crypto.randomBytes(32).toString('hex');

  // Create group assessment link
  const groupLink = await GroupAssessmentLink.create({
    testId,
    groupName,
    createdBy,
    linkToken,
    perspectives: validatedPerspectives,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    notes: notes || "",
    isActive: true
  });

  // Populate references
  await groupLink.populate([
    { path: "testId", select: "title shortDescription" },
    { path: "createdBy", select: "firstName lastName email" }
  ]);

  return created(res, "Group assessment link created successfully", groupLink);
});

/**
 * Get all group assessment links (admin)
 * GET /api/admin/group-assessment-links
 */
exports.list = asyncHandler(async (req, res) => {
  const { isActive, testId } = req.query;

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (testId) filter.testId = testId;

  const links = await GroupAssessmentLink.find(filter)
    .populate("testId", "title shortDescription imageUrl")
    .populate("createdBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, "Group assessment links", links);
});

/**
 * Get single group assessment link
 * GET /api/admin/group-assessment-links/:linkId
 */
exports.getById = asyncHandler(async (req, res) => {
  const { linkId } = req.params;

  const link = await GroupAssessmentLink.findById(linkId)
    .populate("testId")
    .populate("createdBy", "firstName lastName email");

  if (!link) {
    return res.status(404).json({ 
      success: false, 
      message: "Group assessment link not found" 
    });
  }

  return ok(res, "Group assessment link", link);
});

/**
 * Update group assessment link
 * PUT /api/admin/group-assessment-links/:linkId
 */
exports.update = asyncHandler(async (req, res) => {
  const { linkId } = req.params;
  const { groupName, perspectives, expiresAt, isActive, notes } = req.body;

  const link = await GroupAssessmentLink.findById(linkId);

  if (!link) {
    return res.status(404).json({ 
      success: false, 
      message: "Group assessment link not found" 
    });
  }

  if (groupName) link.groupName = groupName;
  if (expiresAt !== undefined) link.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (isActive !== undefined) link.isActive = isActive;
  if (notes !== undefined) link.notes = notes;

  if (perspectives && Array.isArray(perspectives)) {
    // Validate perspectives
    const validatedPerspectives = [];
    for (const perspective of perspectives) {
      if (!perspective.perspectiveName) {
        return res.status(400).json({ 
          success: false, 
          message: "Each perspective must have a perspectiveName" 
        });
      }
      // Preserve currentAttempts if perspective already exists
      const existingPerspective = link.perspectives.find(p => 
        p.perspectiveName === perspective.perspectiveName
      );
      validatedPerspectives.push({
        perspectiveName: perspective.perspectiveName.trim(),
        maxAttempts: perspective.maxAttempts || null,
        currentAttempts: existingPerspective?.currentAttempts || 0
      });
    }
    link.perspectives = validatedPerspectives;
  }

  await link.save();

  await link.populate([
    { path: "testId", select: "title shortDescription" },
    { path: "createdBy", select: "firstName lastName email" }
  ]);

  return ok(res, "Group assessment link updated successfully", link);
});

/**
 * Delete group assessment link
 * DELETE /api/admin/group-assessment-links/:linkId
 */
exports.delete = asyncHandler(async (req, res) => {
  const { linkId } = req.params;

  const link = await GroupAssessmentLink.findById(linkId);

  if (!link) {
    return res.status(404).json({ 
      success: false, 
      message: "Group assessment link not found" 
    });
  }

  // Check if any group assessments exist for this link
  const existingGroupAssessment = await GroupAssessment.findOne({ 
    groupAssessmentLinkId: linkId 
  });

  if (existingGroupAssessment) {
    return res.status(400).json({ 
      success: false, 
      message: "Cannot delete link with existing group assessments. Deactivate it instead." 
    });
  }

  await GroupAssessmentLink.findByIdAndDelete(linkId);

  return ok(res, "Group assessment link deleted successfully", null);
});

/**
 * Validate group assessment link token (public)
 * GET /api/public/group-assessment-links/:token/validate
 */
exports.validate = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const linkDoc = await GroupAssessmentLink.findOne({ linkToken: token });
  if (!linkDoc) {
    return res.status(404).json({ success: false, message: "Group assessment link not found" });
  }

  if (!linkDoc.isActive) {
    return res.status(400).json({ success: false, message: "Group assessment link is not active" });
  }

  if (linkDoc.expiresAt && new Date() > linkDoc.expiresAt) {
    return res.status(400).json({ success: false, message: "Group assessment link has expired" });
  }

  const testDoc = await Test.findById(linkDoc.testId);
  if (!testDoc || !testDoc.isActive) {
    return res.status(404).json({ success: false, message: "Test not found or inactive" });
  }

  return ok(res, "Link validated successfully", {
    link: {
      _id: linkDoc._id,
      linkToken: linkDoc.linkToken,
      groupName: linkDoc.groupName,
      expiresAt: linkDoc.expiresAt,
      perspectives: linkDoc.perspectives.map(p => ({
        perspectiveName: p.perspectiveName,
        maxAttempts: p.maxAttempts,
        currentAttempts: p.currentAttempts
      }))
    },
    test: {
      _id: testDoc._id,
      title: testDoc.title,
      shortDescription: testDoc.shortDescription,
      longDescription: testDoc.longDescription,
      durationMinutesMin: testDoc.durationMinutesMin,
      durationMinutesMax: testDoc.durationMinutesMax,
      questionsCount: testDoc.questionsCount,
      imageUrl: testDoc.imageUrl
    }
  });
});


