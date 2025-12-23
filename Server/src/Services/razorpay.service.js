const crypto = require("crypto");
const { razorpayClient } = require("../config/razorpay");
const { cfg } = require("../config/config");

async function createRazorpayOrder({ amountInPaise, currencyValue, receiptValue }) {
  return razorpayClient.orders.create({
    amount: amountInPaise,
    currency: currencyValue,
    receipt: receiptValue
  });
}

function verifyWebhookSignature(rawBodyBuffer, signatureValue) {
  const expected = crypto
    .createHmac("sha256", cfg.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBodyBuffer)
    .digest("hex");

  return expected === signatureValue;
}

module.exports = { createRazorpayOrder, verifyWebhookSignature };
