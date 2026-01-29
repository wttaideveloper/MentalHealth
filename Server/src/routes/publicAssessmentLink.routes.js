const router = require("express").Router();
const Joi = require("joi");
const { validateBody } = require("../middleware/validate.middleware");
const publicAssessmentLinkController = require("../controller/publicAssessmentLink.controller");

// Validate assessment link token (public, no auth required)
router.get(
  "/:token/validate",
  publicAssessmentLinkController.validate
);

// Create payment order for paid assessment link (public, no auth required)
router.post(
  "/:token/payment/order",
  validateBody(Joi.object({
    participantEmail: Joi.string().email().required(),
    participantName: Joi.string().optional()
  })),
  publicAssessmentLinkController.createPaymentOrder
);

// Verify payment for assessment link (public, no auth required)
router.post(
  "/:token/payment/verify",
  validateBody(Joi.object({
    paymentId: Joi.string().required(),
    orderId: Joi.string().required(),
    participantEmail: Joi.string().email().required()
  })),
  publicAssessmentLinkController.verifyPayment
);

// Start anonymous assessment attempt (public, no auth required)
router.post(
  "/:token/start",
  validateBody(Joi.object({
    participantInfo: Joi.object({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      dateOfBirth: Joi.string().optional(),
      gender: Joi.string().optional(),
      studentName: Joi.string().optional() // For group assessment links (Parent/Teacher roles)
    }).optional(),
    perspective: Joi.string().optional() // For group assessment links
  })),
  publicAssessmentLinkController.start
);

// Save answers for anonymous attempt (public, no auth required)
router.post(
  "/:token/save/:attemptId",
  validateBody(Joi.object({
    answers: Joi.object().required()
  })),
  publicAssessmentLinkController.save
);

// Submit anonymous attempt (public, no auth required)
router.post(
  "/:token/submit/:attemptId",
  validateBody(Joi.object({
    answers: Joi.object().optional()
  })),
  publicAssessmentLinkController.submit
);

// Get student name suggestions for group assessment links (public, no auth required)
router.get(
  "/:token/student-suggestions",
  publicAssessmentLinkController.getStudentNameSuggestions
);

module.exports = router;

