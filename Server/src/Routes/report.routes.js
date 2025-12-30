const router = require("express").Router();
const { authMiddleware } = require("../middleware/auth.middleware");
const { consentGateMiddleware } = require("../middleware/consentGate.middleware");
const reportController = require("../controller/report.controller");

// Get report data (JSON)
router.get(
  "/:resultId/data",
  authMiddleware,
  consentGateMiddleware,
  reportController.getReportData
);

// Download PDF report
router.get(
  "/:resultId/download",
  authMiddleware,
  consentGateMiddleware,
  reportController.downloadReport
);

module.exports = router;