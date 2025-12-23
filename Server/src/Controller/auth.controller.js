const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { cfg } = require("../config/config");
const { User } = require("../models/User");
const { RefreshToken } = require("../models/RefreshToken");
const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const { signAccessToken, signRefreshToken, hashToken } = require("../services/token.service");
const { sendVerifyEmail, sendResetPasswordEmail } = require("../services/mail.service");
const { writeAudit } = require("../services/audit.service");

function hashRaw(rawValue) {
  return crypto.createHash("sha256").update(rawValue).digest("hex");
}

exports.signup = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) return res.status(409).json({ success: false, message: "Email already registered" });

  const passwordHashValue = await bcrypt.hash(password, 10);
  const verifyTokenRaw = crypto.randomBytes(32).toString("hex");
  const verifyTokenHash = hashRaw(verifyTokenRaw);

  const newUser = await User.create({
    email: email.toLowerCase(),
    passwordHash: passwordHashValue,
    firstName,
    lastName,
    isEmailVerified: false,
    emailVerifyTokenHash: verifyTokenHash
  });

  const verifyUrl = `${cfg.APP_BASE_URL}/verify-email?email=${encodeURIComponent(email)}&token=${verifyTokenRaw}`;
  await sendVerifyEmail(email.toLowerCase(), verifyUrl);

  await writeAudit({ userId: newUser._id, action: "SIGNUP", resourceType: "user", resourceId: String(newUser._id), req });

  return created(res, "Signup successful. Verify email.", { userId: newUser._id });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  const userDoc = await User.findOne({ email: email.toLowerCase() });
  if (!userDoc) return res.status(404).json({ success: false, message: "User not found" });

  const tokenHash = hashRaw(token);
  if (tokenHash !== userDoc.emailVerifyTokenHash) {
    return res.status(400).json({ success: false, message: "Invalid verify token" });
  }

  userDoc.isEmailVerified = true;
  userDoc.emailVerifyTokenHash = "";
  await userDoc.save();

  await writeAudit({ userId: userDoc._id, action: "EMAIL_VERIFIED", resourceType: "user", resourceId: String(userDoc._id), req });

  return ok(res, "Email verified", null);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password, deviceId } = req.body;

  const userDoc = await User.findOne({ email: email.toLowerCase() });
  if (!userDoc) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const passOk = await bcrypt.compare(password, userDoc.passwordHash || "");
  if (!passOk) return res.status(401).json({ success: false, message: "Invalid credentials" });

  if (!userDoc.isEmailVerified) {
    return res.status(403).json({ success: false, message: "Email not verified" });
  }

  const accessTokenValue = signAccessToken(userDoc);
  const refreshTokenValue = signRefreshToken(userDoc);
  const refreshHashValue = hashToken(refreshTokenValue);

  const expiresAtValue = new Date(Date.now() + cfg.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: userDoc._id,
    tokenHash: refreshHashValue,
    deviceId: deviceId || "",
    expiresAt: expiresAtValue
  });

  await writeAudit({ userId: userDoc._id, action: "LOGIN", resourceType: "user", resourceId: String(userDoc._id), req });

  return ok(res, "Login success", {
    accessToken: accessTokenValue,
    refreshToken: refreshTokenValue
  });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const refreshHashValue = hashToken(refreshToken);

  const tokenDoc = await RefreshToken.findOne({ tokenHash: refreshHashValue, revokedAt: null });
  if (!tokenDoc) return res.status(401).json({ success: false, message: "Invalid refresh token" });
  if (tokenDoc.expiresAt < new Date()) return res.status(401).json({ success: false, message: "Refresh expired" });

  const userDoc = await User.findById(tokenDoc.userId);
  if (!userDoc) return res.status(401).json({ success: false, message: "Invalid refresh token" });

  // rotate refresh
  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  const newAccess = signAccessToken(userDoc);
  const newRefresh = signRefreshToken(userDoc);
  const newRefreshHash = hashToken(newRefresh);

  const newExpiresAt = new Date(Date.now() + cfg.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: userDoc._id,
    tokenHash: newRefreshHash,
    deviceId: tokenDoc.deviceId,
    expiresAt: newExpiresAt
  });

  return ok(res, "Refreshed", { accessToken: newAccess, refreshToken: newRefresh });
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const refreshHashValue = hashToken(refreshToken);

  await RefreshToken.updateOne({ tokenHash: refreshHashValue }, { $set: { revokedAt: new Date() } });
  return ok(res, "Logged out", null);
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const userDoc = await User.findOne({ email: email.toLowerCase() });
  if (!userDoc) return ok(res, "If user exists, reset email sent", null);

  const resetRaw = crypto.randomBytes(32).toString("hex");
  userDoc.resetPasswordTokenHash = hashRaw(resetRaw);
  userDoc.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await userDoc.save();

  const resetUrl = `${cfg.APP_BASE_URL}/reset-password?email=${encodeURIComponent(email)}&token=${resetRaw}`;
  await sendResetPasswordEmail(email.toLowerCase(), resetUrl);

  return ok(res, "If user exists, reset email sent", null);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;

  const userDoc = await User.findOne({ email: email.toLowerCase() });
  if (!userDoc) return res.status(400).json({ success: false, message: "Invalid reset link" });

  if (!userDoc.resetPasswordExpiresAt || userDoc.resetPasswordExpiresAt < new Date()) {
    return res.status(400).json({ success: false, message: "Reset expired" });
  }

  if (hashRaw(token) !== userDoc.resetPasswordTokenHash) {
    return res.status(400).json({ success: false, message: "Invalid reset token" });
  }

  userDoc.passwordHash = await bcrypt.hash(newPassword, 10);
  userDoc.resetPasswordTokenHash = "";
  userDoc.resetPasswordExpiresAt = null;
  await userDoc.save();

  await writeAudit({ userId: userDoc._id, action: "PASSWORD_RESET", resourceType: "user", resourceId: String(userDoc._id), req });

  return ok(res, "Password reset successful", null);
});

exports.me = asyncHandler(async (req, res) => {
  return ok(res, "Me", req.user);
});

/**
 * Google OAuth placeholder endpoints:
 * - Implement with passport-google-oauth20 later
 */
exports.googleStart = asyncHandler(async (req, res) => {
  return res.status(501).json({ success: false, message: "Google OAuth not configured yet" });
});

exports.googleCallback = asyncHandler(async (req, res) => {
  return res.status(501).json({ success: false, message: "Google OAuth not configured yet" });
});
