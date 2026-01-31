const router = require("express").Router();
const groupAssessmentLinkController = require("../controller/groupAssessmentLink.controller");
const publicGroupAssessmentLinkController = require("../controller/publicGroupAssessmentLink.controller");

// Validate group assessment link token (public, no auth required)
router.get(
  "/:token/validate",
  groupAssessmentLinkController.validate
);

// Create student profile (Student role only)
router.post(
  "/:token/students",
  publicGroupAssessmentLinkController.createStudentProfile
);

// Get list of students for selection (Parent/Teacher roles)
router.get(
  "/:token/students",
  publicGroupAssessmentLinkController.getStudents
);

module.exports = router;
