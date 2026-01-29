const router = require("express").Router();
const { authMiddleware } = require("../middleware/auth.middleware");
const { consentGateMiddleware } = require("../middleware/consentGate.middleware");
const groupAssessmentController = require("../controller/groupAssessment.controller");

// Create group assessment
router.post(
  "/",
  authMiddleware,
  consentGateMiddleware,
  groupAssessmentController.create
);

// List group assessments
router.get(
  "/",
  authMiddleware,
  consentGateMiddleware,
  groupAssessmentController.list
);

// Get single group assessment
router.get(
  "/:groupId",
  authMiddleware,
  consentGateMiddleware,
  groupAssessmentController.getById
);

// Update group assessment
router.put(
  "/:groupId",
  authMiddleware,
  consentGateMiddleware,
  groupAssessmentController.update
);

// Delete group assessment
router.delete(
  "/:groupId",
  authMiddleware,
  consentGateMiddleware,
  groupAssessmentController.delete
);

// Get combined report
router.get(
  "/:groupId/report",
  authMiddleware,
  consentGateMiddleware,
  groupAssessmentController.getCombinedReport
);

// Download combined PDF report
router.get(
  "/:groupId/report/pdf",
  authMiddleware,
  consentGateMiddleware,
  groupAssessmentController.downloadCombinedReport
);

// Merge two group assessments (admin only)
router.post(
  "/:sourceId/merge/:targetId",
  authMiddleware,
  consentGateMiddleware,
  groupAssessmentController.merge
);

module.exports = router;

