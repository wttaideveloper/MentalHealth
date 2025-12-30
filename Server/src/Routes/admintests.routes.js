const router = require("express").Router();
const Joi = require("joi");
const { authMiddleware, requireRole } = require("../middleware/auth.middleware");
const { validateBody } = require("../middleware/validate.middleware");
const adminTestsController = require("../controller/admintests.controller");

// Get all tests including inactive (admin only)
router.get(
  "/",
  authMiddleware,
  requireRole("admin"),
  adminTestsController.listAll
);

// Get test by ID (admin only)
router.get(
  "/:testId",
  authMiddleware,
  requireRole("admin"),
  adminTestsController.getById
);

// Create new test (admin only)
router.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  validateBody(Joi.object({
    title: Joi.string().required(),
    category: Joi.string().allow("").optional(),
    shortDescription: Joi.string().allow("").optional(),
    longDescription: Joi.string().allow("").optional(),
    durationMinutesMin: Joi.number().optional(),
    durationMinutesMax: Joi.number().optional(),
    questionsCount: Joi.number().optional(),
    price: Joi.number().optional(),
    mrp: Joi.number().optional(),
    imageUrl: Joi.string().allow("").optional(),
    tag: Joi.string().allow("").optional(),
    timeLimitSeconds: Joi.number().optional(),
    schemaJson: Joi.object().required(),
    eligibilityRules: Joi.object().optional(),
    scoringRules: Joi.object().optional(),
    riskRules: Joi.object().optional(),
    isActive: Joi.boolean().optional(),
    popularityScore: Joi.number().optional()
  })),
  adminTestsController.create
);

// Update test (admin only)
router.put(
  "/:testId",
  authMiddleware,
  requireRole("admin"),
  validateBody(Joi.object({
    title: Joi.string().optional(),
    category: Joi.string().allow("").optional(),
    shortDescription: Joi.string().allow("").optional(),
    longDescription: Joi.string().allow("").optional(),
    durationMinutesMin: Joi.number().optional(),
    durationMinutesMax: Joi.number().optional(),
    questionsCount: Joi.number().optional(),
    price: Joi.number().optional(),
    mrp: Joi.number().optional(),
    imageUrl: Joi.string().allow("").optional(),
    tag: Joi.string().allow("").optional(),
    timeLimitSeconds: Joi.number().optional(),
    schemaJson: Joi.object().optional(),
    eligibilityRules: Joi.object().optional(),
    scoringRules: Joi.object().optional(),
    riskRules: Joi.object().optional(),
    isActive: Joi.boolean().optional(),
    popularityScore: Joi.number().optional()
  })),
  adminTestsController.update
);

// Delete test (admin only - soft delete)
router.delete(
  "/:testId",
  authMiddleware,
  requireRole("admin"),
  adminTestsController.delete
);

module.exports = router;

