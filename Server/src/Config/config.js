const cfg = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI,

  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  APP_BASE_URL: process.env.APP_BASE_URL || "http://localhost:3000",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN_DAYS: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || 30),

  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: Number(process.env.MAIL_PORT || 587),
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,

  CRYPTO_ENC_KEY: process.env.CRYPTO_ENC_KEY,
  CRYPTO_ENC_IV: process.env.CRYPTO_ENC_IV,

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

  GSTIN: process.env.GSTIN || "",
  GST_PERCENT: Number(process.env.GST_PERCENT || 18),
  INVOICE_PREFIX: process.env.INVOICE_PREFIX || "INV"
};

module.exports = { cfg };
