const router = require("express").Router();
const Joi = require("joi");

const { authMiddleware } = require("../middlewares/auth.middleware");
const { consentGateMiddleware } = require("../middlewares/consentGate.middleware");
const { validateBody } = require("../middlewares/validate.middleware");

const attemptController = require("../controllers/attempt.controller");
const { entitlementMiddleware } = require("../middlewares/entitlement.middleware");

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

// Submit
router.post(
  "/:attemptId/submit",
  authMiddleware,
  consentGateMiddleware,
  attemptController.submit
);

module.exports = router;
