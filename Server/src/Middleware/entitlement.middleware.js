const { asyncHandler } = require("../utils/Asynchandler");
const { Entitlement } = require("../model/Entitlement");

/**
 * Entitlement Middleware
 * Checks if user has access to paid tests
 * For free tests (price === 0), access is granted automatically
 * For paid tests, checks Entitlement model for active, non-expired entitlement
 */
const entitlementMiddleware = asyncHandler(async (req, res, next) => {
  const testDoc = req.test; // Should be set by loadTest middleware
  const userId = req.user._id;
  
  if (!testDoc) {
    return res.status(400).json({ 
      success: false, 
      message: "Test not loaded. loadTest middleware must run before entitlement middleware" 
    });
  }
  
  // Free tests don't require entitlement
  if (testDoc.price === 0 || !testDoc.price) {
    return next();
  }
  
  // For paid tests, check for active entitlement
  const now = new Date();
  
  // Check for test-specific entitlement
  const testEntitlement = await Entitlement.findOne({
    userId,
    scopeType: "test",
    scopeId: testDoc._id,
    status: "active",
    validFrom: { $lte: now },
    validTo: { $gte: now }
  });
  
  if (testEntitlement) {
    // User has specific test entitlement
    req.entitlement = testEntitlement;
    return next();
  }
  
  // Check for plan-based entitlement (if scopeId is null, it's a plan-wide entitlement)
  const planEntitlement = await Entitlement.findOne({
    userId,
    scopeType: "plan",
    scopeId: null,
    status: "active",
    validFrom: { $lte: now },
    validTo: { $gte: now }
  });
  
  if (planEntitlement) {
    // User has plan-based entitlement
    req.entitlement = planEntitlement;
    return next();
  }
  
  // No valid entitlement found
  return res.status(403).json({ 
    success: false, 
    message: "You don't have access to this paid test. Please purchase it first." 
  });
});

module.exports = { entitlementMiddleware };