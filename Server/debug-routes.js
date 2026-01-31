const express = require("express");
const router = express.Router();

console.log("Step 1: Router created, type:", typeof router);

try {
  console.log("Step 2: Loading controllers...");
  const groupAssessmentLinkController = require("./src/controller/groupAssessmentLink.controller");
  console.log("Controller 1 loaded");
  const publicGroupAssessmentLinkController = require("./src/controller/publicGroupAssessmentLink.controller");
  console.log("Controller 2 loaded");

  console.log("Step 3: Registering routes...");
  router.get("/:token/validate", groupAssessmentLinkController.validate);
  console.log("Route 1 registered, stack:", router.stack.length);
  
  router.post("/:token/students", publicGroupAssessmentLinkController.createStudentProfile);
  console.log("Route 2 registered, stack:", router.stack.length);
  
  router.get("/:token/students", publicGroupAssessmentLinkController.getStudents);
  console.log("Route 3 registered, stack:", router.stack.length);

  console.log("Step 4: Router type before export:", typeof router);
  console.log("Step 5: Exporting router...");
  module.exports = router;
  console.log("Step 6: Export complete");
} catch (error) {
  console.error("ERROR during setup:", error.message);
  console.error(error.stack);
  module.exports = router; // Export router even on error
}

