const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { cfg } = require("../config/config");

function signAccessToken(userDoc) {
  return jwt.sign({ sub: String(userDoc._id), role: userDoc.role }, cfg.JWT_ACCESS_SECRET, {
    expiresIn: cfg.JWT_ACCESS_EXPIRES_IN
  });
}

function signRefreshToken(userDoc) {
  const refreshPayload = { sub: String(userDoc._id) };
  return jwt.sign(refreshPayload, cfg.JWT_REFRESH_SECRET, {
    expiresIn: `${cfg.JWT_REFRESH_EXPIRES_IN_DAYS}d`
  });
}

function hashToken(rawTokenValue) {
  return crypto.createHash("sha256").update(rawTokenValue).digest("hex");
}

module.exports = { signAccessToken, signRefreshToken, hashToken };
