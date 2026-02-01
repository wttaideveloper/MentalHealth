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

/**
 * Get results for a specific group assessment link (admin only)
 * Returns group assessments organized by student/group name
 * GET /api/admin/group-assessment-links/:linkId/results
 */
exports.getLinkResults = asyncHandler(async (req, res) => {
  const { StudentProfile } = require("../model/StudentProfile");
  const { linkId } = req.params;
  const { page = 1, limit = 20, search } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Find the group assessment link first
  const linkDoc = await GroupAssessmentLink.findById(linkId);
  if (!linkDoc) {
    return res.status(404).json({ success: false, message: "Group assessment link not found" });
  }

  // Find all group assessments for this link
  const filter = { 
    groupAssessmentLinkId: linkId,
    linkToken: linkDoc.linkToken
  };

  // Add search filter if provided
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { groupName: searchRegex },
      { normalizedStudentName: searchRegex }
    ];
  }

  const [groupAssessments, total] = await Promise.all([
    GroupAssessment.find(filter)
      .populate("testId", "title category questionsCount")
      .populate("subjectId", "name parentName classGrade school")
      .populate("perspectives.resultId", "score band bandDescription riskFlags createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    GroupAssessment.countDocuments(filter)
  ]);

  // Format the response to show student-organized data
  const formattedResults = groupAssessments.map(ga => {
    const completedPerspectives = ga.perspectives.filter(p => p.resultId).length;
    const totalPerspectives = ga.perspectives.length;
    
    // Get perspective completion status
    const perspectiveStatus = ga.perspectives.map(p => ({
      name: p.perspectiveName,
      completed: !!p.resultId,
      resultId: p.resultId?._id || null
    }));

    return {
      _id: ga._id,
      studentName: ga.subjectId?.name || ga.groupName,
      groupName: ga.groupName,
      assessment: ga.testId?.title || 'N/A',
      assessmentId: ga.testId?._id,
      questionsCount: ga.testId?.questionsCount || 0,
      perspectives: perspectiveStatus,
      completedCount: completedPerspectives,
      totalPerspectives: totalPerspectives,
      status: ga.status,
      createdAt: ga.createdAt,
      completedAt: ga.completedAt,
      subjectId: ga.subjectId?._id,
      studentProfile: ga.subjectId ? {
        name: ga.subjectId.name,
        parentName: ga.subjectId.parentName,
        classGrade: ga.subjectId.classGrade,
        school: ga.subjectId.school
      } : null
    };
  });

  return ok(res, "Group assessment link results", {
    results: formattedResults,
    link: {
      _id: linkDoc._id,
      linkToken: linkDoc.linkToken,
      groupName: linkDoc.groupName,
      perspectives: linkDoc.perspectives
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * Get detailed information for a specific group assessment (admin only)
 * GET /api/admin/group-assessment-links/:linkId/group-assessments/:groupId
 */
exports.getGroupAssessmentDetails = asyncHandler(async (req, res) => {
  const { Result } = require("../model/Result");
  const { linkId, groupId } = req.params;

  // Verify link exists
  const linkDoc = await GroupAssessmentLink.findById(linkId);
  if (!linkDoc) {
    return res.status(404).json({ success: false, message: "Group assessment link not found" });
  }

  // Find the group assessment
  const groupAssessment = await GroupAssessment.findById(groupId)
    .populate("testId", "title category questionsCount")
    .populate("subjectId", "name parentName classGrade school dateOfBirth")
    .populate("perspectives.resultId")
    .lean();

  if (!groupAssessment) {
    return res.status(404).json({ success: false, message: "Group assessment not found" });
  }

  // Verify it belongs to this link
  if (groupAssessment.groupAssessmentLinkId.toString() !== linkId) {
    return res.status(403).json({ success: false, message: "Group assessment does not belong to this link" });
  }

  // Fetch full result details for each perspective
  const resultIds = groupAssessment.perspectives
    .map(p => p.resultId)
    .filter(Boolean)
    .map(r => r._id || r);

  const results = await Result.find({ _id: { $in: resultIds } })
    .populate("attemptId", "startedAt submittedAt answers participantInfo")
    .populate("testId", "title")
    .lean();

  // Organize results by perspective and convert categoryResults Maps to objects
  const resultsByPerspective = {};
  results.forEach(result => {
    const perspective = groupAssessment.perspectives.find(p => 
      p.resultId && (p.resultId._id ? p.resultId._id.toString() : p.resultId.toString()) === result._id.toString()
    );
    if (perspective) {
      // Convert categoryResults Map to object if needed
      let processedResult = { ...result };
      if (processedResult.categoryResults instanceof Map) {
        processedResult.categoryResults = Object.fromEntries(processedResult.categoryResults);
      }
      resultsByPerspective[perspective.perspectiveName] = processedResult;
    }
  });

  return ok(res, "Group assessment details", {
    groupAssessment: {
      _id: groupAssessment._id,
      groupName: groupAssessment.groupName,
      status: groupAssessment.status,
      createdAt: groupAssessment.createdAt,
      completedAt: groupAssessment.completedAt,
      test: groupAssessment.testId,
      studentProfile: groupAssessment.subjectId,
      perspectives: groupAssessment.perspectives.map(p => ({
        name: p.perspectiveName,
        completed: !!p.resultId,
        resultId: p.resultId?._id || null,
        participantInfo: p.participantInfo
      })),
      results: resultsByPerspective
    }
  });
});

/**
 * Download PDF for a group assessment (admin only)
 * GET /api/admin/group-assessment-links/:linkId/group-assessments/:groupId/pdf
 */
exports.downloadGroupAssessmentPDF = asyncHandler(async (req, res) => {
  const { generateCombinedReportPdf } = require("../services/pdf.service");
  const { Result } = require("../model/Result");
  const fs = require("fs");
  const { linkId, groupId } = req.params;

  // Verify link exists
  const linkDoc = await GroupAssessmentLink.findById(linkId);
  if (!linkDoc) {
    return res.status(404).json({ success: false, message: "Group assessment link not found" });
  }

  // Find the group assessment
  const groupAssessment = await GroupAssessment.findById(groupId)
    .populate("testId", "title")
    .populate("subjectId", "name parentName")
    .populate("perspectives.resultId")
    .lean();

  if (!groupAssessment) {
    return res.status(404).json({ success: false, message: "Group assessment not found" });
  }

  // Verify it belongs to this link
  if (groupAssessment.groupAssessmentLinkId.toString() !== linkId) {
    return res.status(403).json({ success: false, message: "Group assessment does not belong to this link" });
  }

  // Fetch all results
  const resultIds = groupAssessment.perspectives
    .map(p => p.resultId)
    .filter(Boolean)
    .map(r => r._id || r);

  if (resultIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "No results available for this group assessment" 
    });
  }

  const results = await Result.find({ _id: { $in: resultIds } })
    .populate("attemptId", "participantInfo")
    .lean();

  // Convert categoryResults Maps to objects and organize by perspective
  const processedResults = {};
  for (const result of results) {
    let processed = { ...result };
    if (processed.categoryResults instanceof Map) {
      processed.categoryResults = Object.fromEntries(processed.categoryResults);
    }
    
    // Find which perspective this result belongs to
    const perspective = groupAssessment.perspectives.find(p => 
      p.resultId && (p.resultId._id ? p.resultId._id.toString() : p.resultId.toString()) === result._id.toString()
    );
    
    if (perspective) {
      processedResults[perspective.perspectiveName] = processed;
    }
  }

  // Prepare subject info
  const subjectInfo = groupAssessment.subjectId
    ? groupAssessment.subjectId.name || 'Student'
    : groupAssessment.groupName;

  // Generate PDF filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `group-assessment-${groupId}-${timestamp}.pdf`;

  try {
    // Generate PDF file
    const filePath = await generateCombinedReportPdf({
      fileName,
      groupName: groupAssessment.groupName,
      testTitle: groupAssessment.testId.title,
      subjectInfo,
      results: processedResults
    });

    // Set headers for PDF download
    const safeFileName = `Group-Assessment-${groupAssessment.groupName.replace(/[^a-z0-9]/gi, "-")}-${timestamp}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming PDF:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error generating report" });
      }
    });

  } catch (error) {
    console.error("Error generating combined PDF report:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error generating report" 
    });
  }
});


