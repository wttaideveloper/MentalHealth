const { getLatestConsentVersion } = require("../services/consent.service");

async function consentGateMiddleware(req, res, next) {
  const latestConsent = await getLatestConsentVersion();
  if (!latestConsent) return next();

  const acceptedVersion = req.user.latestConsentAcceptedVersion || null;
  if (acceptedVersion !== latestConsent.version) {
    return res.status(403).json({
      success: false,
      code: "CONSENT_REQUIRED",
      latestVersion: latestConsent.version
    });
  }
  next();
}

module.exports = { consentGateMiddleware };
