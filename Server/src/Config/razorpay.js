const Razorpay = require("razorpay");
const { cfg } = require("./config");

const razorpayClient = new Razorpay({
  key_id: cfg.RAZORPAY_KEY_ID,
  key_secret: cfg.RAZORPAY_KEY_SECRET
});

module.exports = { razorpayClient };
