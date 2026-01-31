const express = require("express");
const router = express.Router();
const groupAssessmentLinkController = require("./src/controller/groupAssessmentLink.controller");
const publicGroupAssessmentLinkController = require("./src/controller/publicGroupAssessmentLink.controller");

console.log("Router type:", typeof router);
console.log("Controllers loaded");

router.get("/:token/validate", groupAssessmentLinkController.validate);
router.post("/:token/students", publicGroupAssessmentLinkController.createStudentProfile);
router.get("/:token/students", publicGroupAssessmentLinkController.getStudents);

console.log("Routes registered:", router.stack.length);
console.log("Router type after routes:", typeof router);

module.exports = router;
