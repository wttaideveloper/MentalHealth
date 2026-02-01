const router = require("express").Router();
const { authMiddleware, requireRole } = require("../middleware/auth.middleware");
const { consentGateMiddleware } = require("../middleware/consentGate.middleware");
const groupAssessmentLinkController = require("../controller/groupAssessmentLink.controller");

// Admin routes
router.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  consentGateMiddleware,
  groupAssessmentLinkController.create
);

router.get(
  "/",
  authMiddleware,
  requireRole("admin"),
  consentGateMiddleware,
  groupAssessmentLinkController.list
);

router.get(
  "/:linkId",
  authMiddleware,
  requireRole("admin"),
  consentGateMiddleware,
  groupAssessmentLinkController.getById
);

router.put(
  "/:linkId",
  authMiddleware,
  requireRole("admin"),
  consentGateMiddleware,
  groupAssessmentLinkController.update
);

router.get(
  "/:linkId/results",
  authMiddleware,
  requireRole("admin"),
  consentGateMiddleware,
  groupAssessmentLinkController.getLinkResults
);

router.get(
  "/:linkId/group-assessments/:groupId",
  authMiddleware,
  requireRole("admin"),
  consentGateMiddleware,
  groupAssessmentLinkController.getGroupAssessmentDetails
);

router.get(
  "/:linkId/group-assessments/:groupId/pdf",
  authMiddleware,
  requireRole("admin"),
  consentGateMiddleware,
  groupAssessmentLinkController.downloadGroupAssessmentPDF
);

router.delete(
  "/:linkId",
  authMiddleware,
  requireRole("admin"),
  consentGateMiddleware,
  groupAssessmentLinkController.delete
);

module.exports = router;


