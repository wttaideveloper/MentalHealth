const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { GroupAssessment } = require("../model/GroupAssessment");
const { Test } = require("../model/Test");
const { User } = require("../model/User");
const { Result } = require("../model/Result");
const { TestAttempt } = require("../model/TestAttempt");
const { generateCombinedReportPdf } = require("../services/pdf.service");
const fs = require("fs");

/**
 * Create a new group assessment
 * POST /api/group-assessments
 * Body: { testId, groupName, subjectId (optional), perspectives: [{ perspectiveName, userId }], notes (optional) }
 */
exports.create = asyncHandler(async (req, res) => {
  const { testId, groupName, subjectId, perspectives, notes } = req.body;
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

  // Verify subject exists if provided
  if (subjectId) {
    const subject = await User.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: "Subject user not found" 
      });
    }
  }

  // Validate and verify all perspectives
  const validatedPerspectives = [];
  for (const perspective of perspectives) {
    if (!perspective.perspectiveName || !perspective.userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Each perspective must have perspectiveName and userId" 
      });
    }

    // Verify user exists
    const user = await User.findById(perspective.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: `User not found for perspective: ${perspective.perspectiveName}` 
      });
    }

    validatedPerspectives.push({
      perspectiveName: perspective.perspectiveName.trim(),
      userId: perspective.userId,
      resultId: null
    });
  }

  // Create group assessment
  const groupAssessment = await GroupAssessment.create({
    testId,
    groupName,
    subjectId: subjectId || null,
    createdBy,
    perspectives: validatedPerspectives,
    notes: notes || "",
    status: "pending"
  });

  // Populate references
  await groupAssessment.populate([
    { path: "testId", select: "title shortDescription" },
    { path: "subjectId", select: "firstName lastName email" },
    { path: "perspectives.userId", select: "firstName lastName email" },
    { path: "createdBy", select: "firstName lastName email" }
  ]);

  return created(res, "Group assessment created successfully", groupAssessment);
});

/**
 * Get all group assessments for the current user
 * GET /api/group-assessments
 * For admins, returns all group assessments
 * Query params: status, testId, search (for group name search)
 */
exports.list = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, testId, search } = req.query;
  const isAdmin = req.user.role === "admin";

  // Admin can see all group assessments (including those created via links)
  // Non-admin users see only their own group assessments
  const filter = isAdmin ? {} : {
    $or: [
      { createdBy: userId },
      { subjectId: userId },
      { "perspectives.userId": userId }
    ]
  };

  // Ensure we're querying all group assessments, not filtering by link
  // Group assessments created via links will have groupAssessmentLinkId set
  // but should still be visible to admins
  // For admins, we want to see ALL group assessments regardless of how they were created

  if (status && status !== 'all') filter.status = status;
  if (testId) filter.testId = testId;
  
  // Search by group name or normalized student name (e.g., "Bala" will find "Bala" or "bala")
  if (search) {
    const { normalizeName } = require("../utils/nameMatching.util");
    const normalizedSearch = normalizeName(search);
    
    // Build search conditions
    const searchConditions = [
      { groupName: { $regex: search, $options: "i" } },
      { normalizedStudentName: { $regex: normalizedSearch, $options: "i" } }
    ];
    
    // If filter already has $or (non-admin), combine with AND
    if (filter.$or && !isAdmin) {
      filter.$and = [
        { $or: filter.$or },
        { $or: searchConditions }
      ];
      delete filter.$or;
    } else {
      // For admin or if no existing $or, just use search conditions
      filter.$or = searchConditions;
    }
  }

  console.log(`[LIST] Querying group assessments with filter:`, JSON.stringify(filter, null, 2)); // Debug log
  
  // Query all group assessments (both old flow and new link-based flow)
  // Old flow: createdBy set, no groupAssessmentLinkId
  // New flow: createdBy set (link creator), groupAssessmentLinkId set
  let groupAssessments = await GroupAssessment.find(filter)
    .populate("testId", "title shortDescription imageUrl")
    .populate("subjectId", "firstName lastName email")
    .populate("perspectives.userId", "firstName lastName email")
    .populate("perspectives.resultId", "score band bandDescription categoryResults riskFlags") // Include more fields for display
    .populate("createdBy", "firstName lastName email")
    .populate("groupAssessmentLinkId", "groupName campaignName") // Populate link info if exists
    .sort({ createdAt: -1 })
    .lean();
  
  console.log(`[LIST] Found ${groupAssessments.length} group assessments`); // Debug log
  
  // Log sample data to debug
  if (groupAssessments.length > 0) {
    const sample = groupAssessments[0];
    console.log('[LIST] Sample group assessment:', {
      _id: sample._id,
      groupName: sample.groupName,
      normalizedStudentName: sample.normalizedStudentName,
      groupAssessmentLinkId: sample.groupAssessmentLinkId ? 'YES' : 'NO',
      linkToken: sample.linkToken,
      perspectives: sample.perspectives?.map(p => ({
        name: p.perspectiveName,
        hasResultId: !!p.resultId,
        resultId: p.resultId ? (p.resultId._id || p.resultId) : null,
        resultScore: p.resultId?.score || null
      }))
    });
  }

  // Convert to Mongoose documents for auto-fix (if needed)
  // Note: We'll do auto-fix in the background, not blocking the response
  // For now, just return the data as-is

  console.log(`Found ${groupAssessments.length} group assessments for user ${userId}, admin: ${isAdmin}`); // Debug log
  console.log('Filter used:', JSON.stringify(filter, null, 2)); // Debug log
  
  // Separate old flow (no groupAssessmentLinkId) from new flow (has groupAssessmentLinkId)
  const oldFlowAssessments = groupAssessments.filter(ga => !ga.groupAssessmentLinkId);
  const newFlowAssessments = groupAssessments.filter(ga => ga.groupAssessmentLinkId);
  console.log(`Old flow (manual): ${oldFlowAssessments.length}, New flow (via links): ${newFlowAssessments.length}`); // Debug log
  
  if (groupAssessments.length > 0) {
    console.log('Sample group assessments:'); // Debug log
    groupAssessments.slice(0, 3).forEach((ga, idx) => {
      console.log(`${idx + 1}. ID: ${ga._id}, Name: ${ga.groupName}, Normalized: ${ga.normalizedStudentName}, LinkId: ${ga.groupAssessmentLinkId ? 'YES' : 'NO'}, Status: ${ga.status}`); // Debug log
    });
  }

  return ok(res, "Group assessments", { groupAssessments });
});

/**
 * Get a single group assessment by ID
 * GET /api/group-assessments/:groupId
 */
exports.getById = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  const groupAssessment = await GroupAssessment.findById(groupId)
    .populate("testId")
    .populate("subjectId", "firstName lastName email")
    .populate("perspectives.userId", "firstName lastName email")
    .populate("perspectives.resultId")
    .populate("createdBy", "firstName lastName email");

  if (!groupAssessment) {
    return res.status(404).json({ 
      success: false, 
      message: "Group assessment not found" 
    });
  }

  // Check if user has access (created by, subject, or assigned to any perspective)
  const hasAccess = 
    groupAssessment.createdBy._id.toString() === userId.toString() ||
    (groupAssessment.subjectId && groupAssessment.subjectId._id.toString() === userId.toString()) ||
    (groupAssessment.perspectives && groupAssessment.perspectives.some(p => 
      p.userId && (p.userId._id ? p.userId._id.toString() : p.userId.toString()) === userId.toString()
    ));

  if (!hasAccess) {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied" 
    });
  }

  return ok(res, "Group assessment", groupAssessment);
});

/**
 * Auto-fix old group assessments: Extract student names from participantInfo
 * This fixes group assessments created before student name logic was implemented
 */
async function autoFixOldGroupAssessments(groupAssessment) {
  // Check if this is an old group assessment (has linkId but no normalizedStudentName)
  if (groupAssessment.groupAssessmentLinkId && !groupAssessment.normalizedStudentName) {
    const { normalizeName } = require("../utils/nameMatching.util");
    
    // Try to extract student name from participantInfo in perspectives
    let studentName = null;
    for (const perspective of groupAssessment.perspectives) {
      if (perspective.participantInfo) {
        // For Student role, use their name
        if (perspective.perspectiveName.toLowerCase() === 'student') {
          studentName = perspective.participantInfo.studentName || perspective.participantInfo.name;
        } else {
          // For Parent/Teacher, use studentName field
          studentName = perspective.participantInfo.studentName || studentName;
        }
        if (studentName) break;
      }
    }
    
    // If we found a student name, update the group assessment
    if (studentName) {
      const normalizedStudentName = normalizeName(studentName);
      groupAssessment.groupName = studentName;
      groupAssessment.normalizedStudentName = normalizedStudentName;
      await groupAssessment.save();
      console.log(`Auto-fixed group assessment ${groupAssessment._id}: Updated groupName to "${studentName}"`);
      return true;
    }
  }
  return false;
}

/**
 * Update group assessment
 * PUT /api/group-assessments/:groupId
 */
exports.update = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;
  const { groupName, perspectives, notes } = req.body;

  const groupAssessment = await GroupAssessment.findById(groupId);

  if (!groupAssessment) {
    return res.status(404).json({ 
      success: false, 
      message: "Group assessment not found" 
    });
  }

  // Only creator can update
  if (groupAssessment.createdBy.toString() !== userId.toString()) {
    return res.status(403).json({ 
      success: false, 
      message: "Only creator can update group assessment" 
    });
  }

  // Can't update if already completed
  if (groupAssessment.status === "completed") {
    return res.status(400).json({ 
      success: false, 
      message: "Cannot update completed group assessment" 
    });
  }

  // Update fields
  if (groupName) groupAssessment.groupName = groupName;
  if (notes !== undefined) groupAssessment.notes = notes;
  
  // Update perspectives if provided
  if (perspectives && Array.isArray(perspectives)) {
    // Check if any perspective has a result - can't change those
    for (const existingPerspective of groupAssessment.perspectives) {
      if (existingPerspective.resultId) {
        // Check if this perspective is being modified
        const newPerspective = perspectives.find(p => 
          p.perspectiveName === existingPerspective.perspectiveName && 
          p.userId !== existingPerspective.userId.toString()
        );
        if (newPerspective) {
          return res.status(400).json({ 
            success: false, 
            message: `Cannot change user for perspective "${existingPerspective.perspectiveName}" after result is submitted` 
          });
        }
      }
    }

    // Validate new perspectives
    const validatedPerspectives = [];
    for (const perspective of perspectives) {
      if (!perspective.perspectiveName || !perspective.userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Each perspective must have perspectiveName and userId" 
        });
      }

      const user = await User.findById(perspective.userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: `User not found for perspective: ${perspective.perspectiveName}` 
        });
      }

      // Find existing perspective to preserve resultId
      const existingPerspective = groupAssessment.perspectives.find(p => 
        p.perspectiveName === perspective.perspectiveName
      );

      validatedPerspectives.push({
        perspectiveName: perspective.perspectiveName.trim(),
        userId: perspective.userId,
        resultId: existingPerspective?.resultId || null
      });
    }

    groupAssessment.perspectives = validatedPerspectives;
  }

  // Update status based on results
  const completedCount = groupAssessment.perspectives.filter(p => p.resultId).length;
  const totalCount = groupAssessment.perspectives.length;
  
  if (completedCount === totalCount && totalCount > 0) {
    groupAssessment.status = "completed";
    groupAssessment.completedAt = new Date();
  } else if (completedCount > 0) {
    groupAssessment.status = "in_progress";
  }

  await groupAssessment.save();

  await groupAssessment.populate([
    { path: "testId", select: "title shortDescription" },
    { path: "subjectId", select: "firstName lastName email" },
    { path: "perspectives.userId", select: "firstName lastName email" },
    { path: "createdBy", select: "firstName lastName email" }
  ]);

  return ok(res, "Group assessment updated successfully", groupAssessment);
});

/**
 * Delete group assessment
 * DELETE /api/group-assessments/:groupId
 */
exports.delete = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  const groupAssessment = await GroupAssessment.findById(groupId);

  if (!groupAssessment) {
    return res.status(404).json({ 
      success: false, 
      message: "Group assessment not found" 
    });
  }

  // Only creator can delete
  if (groupAssessment.createdBy.toString() !== userId.toString()) {
    return res.status(403).json({ 
      success: false, 
      message: "Only creator can delete group assessment" 
    });
  }

  // Can't delete if any results exist
  const hasResults = groupAssessment.perspectives.some(p => p.resultId);
  if (hasResults) {
    return res.status(400).json({ 
      success: false, 
      message: "Cannot delete group assessment with existing results" 
    });
  }

  await GroupAssessment.findByIdAndDelete(groupId);

  return ok(res, "Group assessment deleted successfully", null);
});

/**
 * Get combined report data for a group assessment
 * GET /api/group-assessments/:groupId/report
 */
exports.getCombinedReport = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.role === "admin";

  const groupAssessment = await GroupAssessment.findById(groupId)
    .populate("testId")
    .populate("subjectId", "firstName lastName email")
    .populate("perspectives.userId", "firstName lastName email")
    .populate("perspectives.resultId")
    .populate("createdBy", "firstName lastName email");

  if (!groupAssessment) {
    return res.status(404).json({ 
      success: false, 
      message: "Group assessment not found" 
    });
  }

  // Check access - admins always have access
  const hasAccess = isAdmin ||
    groupAssessment.createdBy._id.toString() === userId.toString() ||
    (groupAssessment.subjectId && groupAssessment.subjectId._id.toString() === userId.toString()) ||
    (groupAssessment.perspectives && groupAssessment.perspectives.some(p => 
      p.userId && (p.userId._id ? p.userId._id.toString() : p.userId.toString()) === userId.toString()
    ));

  if (!hasAccess) {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied" 
    });
  }

  // Fetch all results with full details
  // Handle both populated and non-populated resultId
  const resultIds = groupAssessment.perspectives
    .map(p => {
      // If resultId is populated, use _id, otherwise use resultId directly
      if (p.resultId && p.resultId._id) {
        return p.resultId._id;
      }
      return p.resultId;
    })
    .filter(Boolean);

  console.log(`Fetching results for group assessment ${groupId}:`, resultIds); // Debug log

  const results = await Result.find({ _id: { $in: resultIds } })
    .populate("userId", "firstName lastName email")
    .lean();

  console.log(`Found ${results.length} results for group assessment ${groupId}`); // Debug log

  // Convert categoryResults Maps to objects
  const processedResults = results.map(result => {
    const processed = { ...result };
    if (processed.categoryResults instanceof Map) {
      processed.categoryResults = Object.fromEntries(processed.categoryResults);
    }
    return processed;
  });

  // Organize results by perspective name
  const resultsByPerspective = {};
  for (const perspective of groupAssessment.perspectives) {
    if (perspective.resultId) {
      // Handle both populated and non-populated resultId
      const resultIdToMatch = perspective.resultId._id 
        ? perspective.resultId._id.toString() 
        : perspective.resultId.toString();
      
      const result = processedResults.find(r => 
        r._id.toString() === resultIdToMatch
      );
      if (result) {
        resultsByPerspective[perspective.perspectiveName] = result;
        console.log(`Matched result for perspective ${perspective.perspectiveName}:`, result._id); // Debug log
      } else {
        console.log(`No result found for perspective ${perspective.perspectiveName}, resultId:`, perspective.resultId); // Debug log
      }
    }
  }

  console.log(`Results by perspective:`, Object.keys(resultsByPerspective)); // Debug log

  // Build users object by perspective (include participantInfo for anonymous users)
  const usersByPerspective = {};
  for (const perspective of groupAssessment.perspectives) {
    if (perspective.userId) {
      usersByPerspective[perspective.perspectiveName] = perspective.userId;
    } else if (perspective.participantInfo) {
      // For anonymous users, use participantInfo
      usersByPerspective[perspective.perspectiveName] = {
        firstName: perspective.participantInfo.name || 'Anonymous',
        lastName: '',
        email: perspective.participantInfo.email || ''
      };
    } else {
      usersByPerspective[perspective.perspectiveName] = null;
    }
  }

  const reportData = {
    groupAssessment: {
      _id: groupAssessment._id,
      groupName: groupAssessment.groupName,
      testId: groupAssessment.testId,
      subjectId: groupAssessment.subjectId,
      createdBy: groupAssessment.createdBy,
      status: groupAssessment.status,
      completedAt: groupAssessment.completedAt,
      createdAt: groupAssessment.createdAt,
      perspectives: groupAssessment.perspectives
    },
    results: resultsByPerspective,
    users: usersByPerspective
  };

  return ok(res, "Combined report data", reportData);
});

/**
 * Generate and download combined PDF report for a group assessment
 * GET /api/group-assessments/:groupId/report/pdf
 */
exports.downloadCombinedReport = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  const groupAssessment = await GroupAssessment.findById(groupId)
    .populate("testId", "title")
    .populate("subjectId", "firstName lastName email")
    .populate("perspectives.userId", "firstName lastName email")
    .populate("perspectives.resultId")
    .populate("createdBy", "firstName lastName email");

  if (!groupAssessment) {
    return res.status(404).json({ 
      success: false, 
      message: "Group assessment not found" 
    });
  }

  // Check access
  const hasAccess = 
    groupAssessment.createdBy._id.toString() === userId.toString() ||
    (groupAssessment.subjectId && groupAssessment.subjectId._id.toString() === userId.toString()) ||
    (groupAssessment.perspectives && groupAssessment.perspectives.some(p => 
      p.userId && (p.userId._id ? p.userId._id.toString() : p.userId.toString()) === userId.toString()
    ));

  if (!hasAccess) {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied" 
    });
  }

  // Fetch all results
  const resultIds = groupAssessment.perspectives
    .map(p => p.resultId)
    .filter(Boolean);

  if (resultIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "No results available for this group assessment" 
    });
  }

  const results = await Result.find({ _id: { $in: resultIds } })
    .populate("userId", "firstName lastName email")
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
      p.resultId && p.resultId.toString() === result._id.toString()
    );
    
    if (perspective) {
      processedResults[perspective.perspectiveName] = processed;
    }
  }

  // Prepare subject info
  const subjectInfo = groupAssessment.subjectId
    ? `${groupAssessment.subjectId.firstName || ""} ${groupAssessment.subjectId.lastName || ""}`.trim() || groupAssessment.subjectId.email
    : null;

  // Generate PDF filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `combined-report-${groupId}-${timestamp}.pdf`;

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
    const safeFileName = `Combined-Report-${groupAssessment.groupName.replace(/[^a-z0-9]/gi, "-")}-${timestamp}.pdf`;
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

/**
 * Merge two group assessments (for fixing spelling mistakes)
 * POST /api/group-assessments/:sourceId/merge/:targetId
 * Admin only
 */
exports.merge = asyncHandler(async (req, res) => {
  const { sourceId, targetId } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.role === "admin";

  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: "Only admins can merge group assessments" 
    });
  }

  // Find both group assessments
  const sourceGroup = await GroupAssessment.findById(sourceId);
  const targetGroup = await GroupAssessment.findById(targetId);

  if (!sourceGroup || !targetGroup) {
    return res.status(404).json({ 
      success: false, 
      message: "One or both group assessments not found" 
    });
  }

  // Verify they're for the same test and link
  if (sourceGroup.testId.toString() !== targetGroup.testId.toString() ||
      sourceGroup.groupAssessmentLinkId?.toString() !== targetGroup.groupAssessmentLinkId?.toString()) {
    return res.status(400).json({ 
      success: false, 
      message: "Group assessments must be for the same test and link" 
    });
  }

  // Merge perspectives from source to target
  // Update perspectives that don't exist in target
  for (const sourcePerspective of sourceGroup.perspectives) {
    const targetPerspectiveIndex = targetGroup.perspectives.findIndex(
      p => p.perspectiveName === sourcePerspective.perspectiveName
    );

    if (targetPerspectiveIndex === -1) {
      // Add new perspective
      targetGroup.perspectives.push({
        perspectiveName: sourcePerspective.perspectiveName,
        userId: sourcePerspective.userId,
        resultId: sourcePerspective.resultId,
        participantInfo: sourcePerspective.participantInfo
      });
    } else {
      // Update if source has result but target doesn't
      if (sourcePerspective.resultId && !targetGroup.perspectives[targetPerspectiveIndex].resultId) {
        targetGroup.perspectives[targetPerspectiveIndex].resultId = sourcePerspective.resultId;
        targetGroup.perspectives[targetPerspectiveIndex].participantInfo = sourcePerspective.participantInfo;
      }
    }
  }

  // Update results to point to target group
  await Result.updateMany(
    { groupAssessmentId: sourceId },
    { groupAssessmentId: targetId }
  );

  // Update attempts to point to target group
  await TestAttempt.updateMany(
    { groupAssessmentId: sourceId },
    { groupAssessmentId: targetId }
  );

  // Update target group status
  const completedCount = targetGroup.perspectives.filter(p => p.resultId).length;
  const totalPerspectives = targetGroup.perspectives.length;
  if (completedCount === totalPerspectives && totalPerspectives > 0) {
    targetGroup.status = "completed";
    targetGroup.completedAt = new Date();
  } else if (completedCount > 0) {
    targetGroup.status = "in_progress";
  }

  await targetGroup.save();

  // Delete source group
  await GroupAssessment.findByIdAndDelete(sourceId);

  // Populate and return updated target group
  await targetGroup.populate([
    { path: "testId", select: "title shortDescription" },
    { path: "subjectId", select: "firstName lastName email" },
    { path: "perspectives.userId", select: "firstName lastName email" },
    { path: "perspectives.resultId", select: "score band" },
    { path: "createdBy", select: "firstName lastName email" }
  ]);

  return ok(res, "Group assessments merged successfully", targetGroup);
});
