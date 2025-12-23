const router = require("express").Router();
const express = require("express");
const Joi = require("joi");

const { authMiddleware } = require("../middlewares/auth.middleware");
const { consentGateMiddleware } = require("../middlewares/consentGate.middleware");
const { validateBody } = require("../middlewares/validate.middleware");
const paymentController = require("../controllers/payment.controller");

// Create Razorpay order
router.post(
  "/razorpay/order",
  authMiddleware,
  consentGateMiddleware,
  validateBody(Joi.object({ testId: Joi.string().required() })),
  paymentController.createOrder
);

// Webhook: raw body needed for signature verification
router.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBodyBuffer = req.body;
    try {
      req.body = JSON.parse(req.body.toString("utf8"));
    } catch {}
    next();
  },
  paymentController.webhook
);

module.exports = router;
