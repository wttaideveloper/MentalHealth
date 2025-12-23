const { Entitlement } = require("../models/Entitlement");

async function entitlementMiddleware(req, res, next) {
  const testDoc = req.test;
  if (!testDoc) return res.status(500).json({ success: false, message: "Test missing in middleware" });

  if (testDoc.price <= 0) return next(); // free test

  const nowDate = new Date();
  const entitlementDoc = await Entitlement.findOne({
    userId: req.user._id,
    status: "active",
    validFrom: { $lte: nowDate },
    validTo: { $gte: nowDate },
    $or: [{ scopeType: "test", scopeId: testDoc._id }, { scopeType: "plan" }]
  });

  if (!entitlementDoc) {
    return res.status(402).json({ success: false, message: "Payment required / no entitlement" });
  }
  next();
}

module.exports = { entitlementMiddleware };
