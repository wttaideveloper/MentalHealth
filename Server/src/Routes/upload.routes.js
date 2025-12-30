const router = require("express").Router();
const { authMiddleware, requireRole } = require("../middleware/auth.middleware");
const uploadController = require("../controller/upload.controller");

// Upload image (admin only)
router.post(
  "/image",
  authMiddleware,
  requireRole("admin"),
  uploadController.uploadImage
);

module.exports = router;

