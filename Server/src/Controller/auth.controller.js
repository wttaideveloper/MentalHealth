const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { cfg } = require("../config/config");
const { User } = require("../model/User");
const { RefreshToken } = require("../model/Refreshtoken");
const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
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
  
  // Generate 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const codeHash = hashRaw(verificationCode);
  const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const newUser = await User.create({
    email: email.toLowerCase(),
    passwordHash: passwordHashValue,
    firstName,
    lastName,
    isEmailVerified: false,
    emailVerificationCode: codeHash,
    emailVerificationCodeExpiresAt: codeExpiresAt
  });

  // Try to send verification email with code, but don't fail signup if it fails
  try {
    await sendVerifyEmail(email.toLowerCase(), verificationCode);
  } catch (emailError) {
    // Log error but don't fail the signup
    console.error("⚠️  Failed to send verification email:", emailError.message);
    // In development, log the code so user can manually verify
    if (cfg.NODE_ENV === "development") {
      console.log(`\n📧 Verification Code (for development): ${verificationCode}\n`);
      console.log(`Code expires at: ${codeExpiresAt}\n`);
    }
  }

  await writeAudit({ userId: newUser._id, action: "SIGNUP", resourceType: "user", resourceId: String(newUser._id), req });

  return created(res, "Signup successful. Verify email.", { userId: newUser._id });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const userDoc = await User.findOne({ email: email.toLowerCase() });
  if (!userDoc) return res.status(404).json({ success: false, message: "User not found" });

  // Check if code exists and is not expired
  if (!userDoc.emailVerificationCode) {
    return res.status(400).json({ success: false, message: "Verification code not found. Please request a new code." });
  }

  if (!userDoc.emailVerificationCodeExpiresAt || userDoc.emailVerificationCodeExpiresAt < new Date()) {
    return res.status(400).json({ success: false, message: "Verification code expired. Please request a new code." });
  }

  // Verify the code
  const codeHash = hashRaw(code);
  if (codeHash !== userDoc.emailVerificationCode) {
    return res.status(400).json({ success: false, message: "Invalid verification code" });
  }

  // Code is valid, verify email
  userDoc.isEmailVerified = true;
  userDoc.emailVerificationCode = "";
  userDoc.emailVerificationCodeExpiresAt = null;
  userDoc.emailVerifyTokenHash = ""; // Clear old token if exists
  await userDoc.save();

  await writeAudit({ userId: userDoc._id, action: "EMAIL_VERIFIED", resourceType: "user", resourceId: String(userDoc._id), req });

  return ok(res, "Email verified", null);
});

exports.resendVerificationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userDoc = await User.findOne({ email: email.toLowerCase() });
  
  if (!userDoc) {
    // Don't reveal if user exists or not
    return ok(res, "If user exists and email is not verified, verification code will be sent", null);
  }

  if (userDoc.isEmailVerified) {
    return res.status(400).json({ success: false, message: "Email already verified" });
  }

  // Generate new 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = hashRaw(verificationCode);
  const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  userDoc.emailVerificationCode = codeHash;
  userDoc.emailVerificationCodeExpiresAt = codeExpiresAt;
  await userDoc.save();

  // Try to send verification email with code
  try {
    await sendVerifyEmail(email.toLowerCase(), verificationCode);
  } catch (emailError) {
    console.error("⚠️  Failed to send verification email:", emailError.message);
    if (cfg.NODE_ENV === "development") {
      console.log(`\n📧 Verification Code (for development): ${verificationCode}\n`);
    }
    // Don't fail the request, code is stored and can be used
  }

  return ok(res, "If user exists and email is not verified, verification code will be sent", null);
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
  
  // Try to send reset email, but don't fail if it fails
  try {
    await sendResetPasswordEmail(email.toLowerCase(), resetUrl);
  } catch (emailError) {
    console.error("⚠️  Failed to send reset password email:", emailError.message);
    console.log("📧 Reset URL (for development):", resetUrl);
    // In development, log the URL so user can manually reset
    if (cfg.NODE_ENV === "development") {
      console.log(`\n🔗 Manual reset password link:\n${resetUrl}\n`);
    }
  }

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
