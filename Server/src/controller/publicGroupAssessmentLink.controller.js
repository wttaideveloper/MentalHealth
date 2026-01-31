const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { GroupAssessmentLink } = require("../model/GroupAssessmentLink");
const { StudentProfile } = require("../model/StudentProfile");
const { Test } = require("../model/Test");

/**
 * Create student profile (Student role only)
 * POST /api/public/group-assessment-links/:token/students
 * Body: { name, dateOfBirth, classGrade, school (optional) }
 */
exports.createStudentProfile = asyncHandler(async (req, res) => {
  console.log(`[CONTROLLER] createStudentProfile called with token: ${req.params.token}`);
  console.log(`[CONTROLLER] Request body:`, req.body);
  const { token } = req.params;
  const { name, dateOfBirth, classGrade, school, parentName } = req.body;

  // Validate required fields
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Student name is required"
    });
  }

  if (!parentName || !parentName.trim()) {
    return res.status(400).json({
      success: false,
      message: "Parent name is required"
    });
  }

  if (!dateOfBirth) {
    return res.status(400).json({
      success: false,
      message: "Date of birth is required"
    });
  }

  if (!classGrade || !classGrade.trim()) {
    return res.status(400).json({
      success: false,
      message: "Class/grade is required"
    });
  }

  // Validate and find the group assessment link
  const groupLink = await GroupAssessmentLink.findOne({ linkToken: token, isActive: true });
  if (!groupLink) {
    return res.status(404).json({
      success: false,
      message: "Group assessment link not found or inactive"
    });
  }

  // Check if link has expired
  if (groupLink.expiresAt && new Date() > groupLink.expiresAt) {
    return res.status(400).json({
      success: false,
      message: "Group assessment link has expired"
    });
  }

  // Check if student profile already exists with same name (prevent duplicates)
  const existingProfile = await StudentProfile.findOne({
    groupAssessmentLinkId: groupLink._id,
    linkToken: token,
    name: name.trim()
  });

  if (existingProfile) {
    return res.status(400).json({
      success: false,
      message: "A student profile with this name already exists for this assessment link"
    });
  }

  // Create student profile
  const studentProfile = await StudentProfile.create({
    groupAssessmentLinkId: groupLink._id,
    linkToken: token,
    name: name.trim(),
    dateOfBirth: new Date(dateOfBirth),
    classGrade: classGrade.trim(),
    school: school ? school.trim() : "",
    parentName: parentName ? parentName.trim() : "",
    createdBy: groupLink.createdBy
  });

  return created(res, "Student profile created successfully", {
    _id: studentProfile._id,
    name: studentProfile.name,
    dateOfBirth: studentProfile.dateOfBirth,
    classGrade: studentProfile.classGrade,
    school: studentProfile.school,
    parentName: studentProfile.parentName
  });
});

/**
 * Get list of students for selection (Parent/Teacher roles)
 * GET /api/public/group-assessment-links/:token/students
 */
exports.getStudents = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Validate and find the group assessment link
  const groupLink = await GroupAssessmentLink.findOne({ linkToken: token, isActive: true });
  if (!groupLink) {
    return res.status(404).json({
      success: false,
      message: "Group assessment link not found or inactive"
    });
  }

  // Get all student profiles for this link
  const students = await StudentProfile.find({
    groupAssessmentLinkId: groupLink._id,
    linkToken: token
  })
    .select("_id name dateOfBirth classGrade school parentName createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, "Students retrieved successfully", students);
});

