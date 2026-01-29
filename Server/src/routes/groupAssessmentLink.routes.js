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

router.delete(
  "/:linkId",
  authMiddleware,
  requireRole("admin"),
  consentGateMiddleware,
  groupAssessmentLinkController.delete
);

module.exports = router;


