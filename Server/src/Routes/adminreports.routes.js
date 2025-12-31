const router = require("express").Router();
const { authMiddleware, requireRole } = require("../middleware/auth.middleware");
const adminReportsController = require("../controller/adminreports.controller");

// Get dashboard summary statistics
router.get(
  "/summary",
  authMiddleware,
  requireRole("admin"),
  adminReportsController.summary
);

// Export purchases as CSV
router.get(
  "/purchases/csv",
  authMiddleware,
  requireRole("admin"),
  adminReportsController.purchasesCsv
);

// Export test attempts/usage as CSV
router.get(
  "/usage/csv",
  authMiddleware,
  requireRole("admin"),
  adminReportsController.usageCsv
);

// Get purchases data as JSON (for viewing)
router.get(
  "/purchases",
  authMiddleware,
  requireRole("admin"),
  adminReportsController.purchasesData
);

// Get usage/test attempts data as JSON (for viewing)
router.get(
  "/usage",
  authMiddleware,
  requireRole("admin"),
  adminReportsController.usageData
);

module.exports = router;