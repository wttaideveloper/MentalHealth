const router = require("express").Router();
const Joi = require("joi");
const { authMiddleware, requireRole } = require("../middleware/auth.middleware");
const { validateBody } = require("../middleware/validate.middleware");
const adminController = require("../controller/admin.controller");

// Admin login endpoint (no auth required)
router.post(
  "/login",
  validateBody(Joi.object({ 
    email: Joi.string().email().required(), 
    password: Joi.string().required(), 
    deviceId: Joi.string().allow("").optional() 
  })),
  adminController.adminLogin
);

// User management endpoints (admin only)
router.get(
  "/users",
  authMiddleware,
  requireRole("admin"),
  adminController.listUsers
);

router.get(
  "/users/:userId",
  authMiddleware,
  requireRole("admin"),
  adminController.getUserById
);

router.put(
  "/users/:userId",
  authMiddleware,
  requireRole("admin"),
  validateBody(Joi.object({
    role: Joi.string().valid("user", "admin").optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    isEmailVerified: Joi.boolean().optional()
  })),
  adminController.updateUser
);

module.exports = router;

