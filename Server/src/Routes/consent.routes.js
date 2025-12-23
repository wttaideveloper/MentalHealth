const router = require("express").Router();
const Joi = require("joi");
const { authMiddleware, requireRole } = require("../middlewares/auth.middleware");
const { validateBody } = require("../middlewares/validate.middleware");
const consentController = require("../controllers/consent.controller");

router.get("/latest", consentController.latest);
router.post("/accept", authMiddleware, consentController.accept);

router.post(
  "/admin/version",
  authMiddleware,
  requireRole("admin"),
  validateBody(Joi.object({
    version: Joi.string().required(),
    tosUrl: Joi.string().allow("").optional(),
    privacyUrl: Joi.string().allow("").optional(),
    effectiveAt: Joi.date().required(),
    isActive: Joi.boolean().optional()
  })),
  consentController.adminCreateVersion
);

module.exports = router;
