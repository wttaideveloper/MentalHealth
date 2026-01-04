const bcrypt = require("bcryptjs");
const { cfg } = require("../config/config");
const { User } = require("../model/User");
const { RefreshToken } = require("../model/RefreshToken");
const { asyncHandler } = require("../utils/Asynchandler");
const { ok, created } = require("../utils/Response");
const { signAccessToken, signRefreshToken, hashToken } = require("../services/token.service");
const { writeAudit } = require("../services/audit.service");

/**
 * Admin login endpoint
 * Validates admin credentials and role
 */
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password, deviceId } = req.body;

  const userDoc = await User.findOne({ email: email.toLowerCase() });
  if (!userDoc) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  // Check if user is admin
  if (userDoc.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
  }

  const passOk = await bcrypt.compare(password, userDoc.passwordHash || "");
  if (!passOk) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

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

  await writeAudit({ userId: userDoc._id, action: "ADMIN_LOGIN", resourceType: "user", resourceId: String(userDoc._id), req });

  return ok(res, "Admin login success", {
    accessToken: accessTokenValue,
    refreshToken: refreshTokenValue,
    user: {
      id: userDoc._id,
      email: userDoc.email,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      role: userDoc.role
    }
  });
});

/**
 * Get all users (admin only)
 */
exports.listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = "", role = "" } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } }
    ];
  }
  if (role) {
    filter.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash -emailVerifyTokenHash -resetPasswordTokenHash -emailVerificationCode -loginOtpCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter)
  ]);

  return ok(res, "Users list", {
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * Get user by ID (admin only)
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const userDoc = await User.findById(req.params.userId)
    .select("-passwordHash -emailVerifyTokenHash -resetPasswordTokenHash -emailVerificationCode -loginOtpCode");
  
  if (!userDoc) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return ok(res, "User", userDoc);
});

/**
 * Update user (admin only)
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role, firstName, lastName, isEmailVerified } = req.body;

  const userDoc = await User.findById(userId);
  if (!userDoc) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (role && ["user", "admin"].includes(role)) {
    userDoc.role = role;
  }
  if (firstName !== undefined) userDoc.firstName = firstName;
  if (lastName !== undefined) userDoc.lastName = lastName;
  if (isEmailVerified !== undefined) userDoc.isEmailVerified = isEmailVerified;

  await userDoc.save();

  await writeAudit({ userId: req.user._id, action: "ADMIN_UPDATE_USER", resourceType: "user", resourceId: userId, req });

  return ok(res, "User updated", userDoc);
});

/**
 * Get all assessment results (admin only - read-only)
 */
exports.listResults = asyncHandler(async (req, res) => {
  const { Result } = require("../model/Result");
  const { page = 1, limit = 20, search = "", testId = "" } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (testId) {
    filter.testId = testId;
  }

  const [results, total] = await Promise.all([
    Result.find(filter)
      .populate("userId", "email firstName lastName")
      .populate("testId", "title category")
      .populate("attemptId", "startedAt submittedAt linkToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Result.countDocuments(filter)
  ]);

  // Filter by search if provided (search in user email, test title, linkToken)
  let filteredResults = results;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredResults = results.filter(r => 
      (r.userId?.email && r.userId.email.toLowerCase().includes(searchLower)) ||
      (r.testId?.title && r.testId.title.toLowerCase().includes(searchLower)) ||
      (r.linkToken && r.linkToken.toLowerCase().includes(searchLower))
    );
  }

  return ok(res, "Results list", {
    results: filteredResults,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: search ? filteredResults.length : total,
      pages: Math.ceil((search ? filteredResults.length : total) / limitNum)
    }
  });
});

/**
 * Get result by ID (admin only - read-only)
 */
exports.getResultById = asyncHandler(async (req, res) => {
  const { Result } = require("../model/Result");
  const resultDoc = await Result.findById(req.params.resultId)
    .populate("userId", "email firstName lastName")
    .populate("testId")
    .populate("attemptId");
  
  if (!resultDoc) {
    return res.status(404).json({ success: false, message: "Result not found" });
  }

  return ok(res, "Result", resultDoc);
});
