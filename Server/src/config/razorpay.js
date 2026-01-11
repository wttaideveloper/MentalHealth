const Razorpay = require("razorpay");
const { cfg } = require("./config");

let razorpayClient = null;

if (cfg.RAZORPAY_KEY_ID && cfg.RAZORPAY_KEY_ID !== 'rzp_test_xxxxx' && cfg.RAZORPAY_KEY_SECRET && cfg.RAZORPAY_KEY_SECRET !== 'xxxxxx') {
  razorpayClient = new Razorpay({
    key_id: cfg.RAZORPAY_KEY_ID,
    key_secret: cfg.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay client initialized');
} else {
  console.warn('⚠️  Razorpay credentials not configured - payment features will be disabled');
}

module.exports = { razorpayClient };
