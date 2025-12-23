const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const { ConsentVersion } = require("../models/ConsentVersion");
const { UserConsent } = require("../models/UserConsent");
const { User } = require("../models/User");
const { getLatestConsentVersion } = require("../services/consent.service");
const { writeAudit } = require("../services/audit.service");

exports.latest = asyncHandler(async (req, res) => {
  const latestConsent = await getLatestConsentVersion();
  return ok(res, "Latest consent", latestConsent);
});

exports.accept = asyncHandler(async (req, res) => {
  const latestConsent = await getLatestConsentVersion();
  if (!latestConsent) return res.status(400).json({ success: false, message: "No active consent configured" });

  await UserConsent.create({
    userId: req.user._id,
    version: latestConsent.version,
    acceptedAt: new Date(),
    ip: req.ip || "",
    userAgent: req.headers["user-agent"] || ""
  });

  await User.updateOne(
    { _id: req.user._id },
    { $set: { latestConsentAcceptedVersion: latestConsent.version } }
  );

  await writeAudit({ userId: req.user._id, action: "CONSENT_ACCEPTED", resourceType: "consent", resourceId: latestConsent.version, req });

  return created(res, "Consent accepted", { version: latestConsent.version });
});

/**
 * Admin helper to create consent versions
 */
exports.adminCreateVersion = asyncHandler(async (req, res) => {
  const createdDoc = await ConsentVersion.create(req.body);
  return created(res, "Consent version created", createdDoc);
});
