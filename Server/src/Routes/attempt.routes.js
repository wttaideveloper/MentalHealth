const router = require("express").Router();
const Joi = require("joi");

const { authMiddleware } = require("../middleware/auth.middleware");
const { consentGateMiddleware } = require("../middleware/consentGate.middleware");
const { validateBody } = require("../middleware/validate.middleware");

const attemptController = require("../controller/attempt.controller");
const { entitlementMiddleware } = require("../middleware/entitlement.middleware");

// List ongoing attempts for current user
router.get(
  "/ongoing",
  authMiddleware,
  attemptController.listOngoing
);

// Start attempt: needs auth + consent + eligibility + entitlement (for paid tests)
router.post(
  "/tests/:testId/start",
  authMiddleware,
  consentGateMiddleware,
  attemptController.loadTest,
  entitlementMiddleware,
  attemptController.start
);

// Autosave
router.post(
  "/:attemptId/save",
  authMiddleware,
  consentGateMiddleware,
  validateBody(Joi.object({ answers: Joi.object().required() })),
  attemptController.save
);

// Submit (optional answers in body to submit directly without separate save)
router.post(
  "/:attemptId/submit",
  authMiddleware,
  consentGateMiddleware,
  validateBody(Joi.object({ answers: Joi.object().optional() })),
  attemptController.submit
);

module.exports = router;
