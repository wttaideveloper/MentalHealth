const jwt = require("jsonwebtoken");
const { cfg } = require("../config/config");
const { User } = require("../models/User");

async function authMiddleware(req, res, next) {
  const headerValue = req.headers.authorization || "";
  const tokenValue = headerValue.startsWith("Bearer ") ? headerValue.slice(7) : null;
  if (!tokenValue) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const decoded = jwt.verify(tokenValue, cfg.JWT_ACCESS_SECRET);
    const userDoc = await User.findById(decoded.sub).select("-passwordHash -emailVerifyTokenHash -resetPasswordTokenHash");
    if (!userDoc) return res.status(401).json({ success: false, message: "Unauthorized" });
    req.user = userDoc;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

function requireRole(roleValue) {
  return function roleGuard(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (req.user.role !== roleValue) return res.status(403).json({ success: false, message: "Forbidden" });
    next();
  };
}

module.exports = { authMiddleware, requireRole };
