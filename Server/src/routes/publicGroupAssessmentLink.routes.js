const router = require("express").Router();
const groupAssessmentLinkController = require("../controller/groupAssessmentLink.controller");

// Validate group assessment link token (public, no auth required)
router.get(
  "/:token/validate",
  groupAssessmentLinkController.validate
);

module.exports = router;


