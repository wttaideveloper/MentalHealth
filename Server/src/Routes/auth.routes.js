const router = require("express").Router();
const Joi = require("joi");
const { validateBody } = require("../middlewares/validate.middleware");
const { authMiddleware } = require("../middlewares/auth.middleware");
const authController = require("../controllers/auth.controller");

router.post(
  "/signup",
  validateBody(Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(1).max(60).required(),
    lastName: Joi.string().min(1).max(60).required()
  })),
  authController.signup
);

router.post(
  "/verify-email",
  validateBody(Joi.object({ email: Joi.string().email().required(), token: Joi.string().required() })),
  authController.verifyEmail
);

router.post(
  "/login",
  validateBody(Joi.object({ email: Joi.string().email().required(), password: Joi.string().required(), deviceId: Joi.string().allow("").optional() })),
  authController.login
);

router.post(
  "/refresh",
  validateBody(Joi.object({ refreshToken: Joi.string().required() })),
  authController.refresh
);

router.post(
  "/logout",
  validateBody(Joi.object({ refreshToken: Joi.string().required() })),
  authController.logout
);

router.post(
  "/forgot-password",
  validateBody(Joi.object({ email: Joi.string().email().required() })),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  validateBody(Joi.object({ email: Joi.string().email().required(), token: Joi.string().required(), newPassword: Joi.string().min(6).required() })),
  authController.resetPassword
);

router.get("/me", authMiddleware, authController.me);

router.get("/google/start", authController.googleStart);
router.get("/google/callback", authController.googleCallback);

module.exports = router;
