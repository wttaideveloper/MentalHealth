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

module.exports = router;