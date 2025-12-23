function calculateAge(dobValue) {
  if (!dobValue) return null;
  const nowDate = new Date();
  const birthDate = new Date(dobValue);
  let ageValue = nowDate.getFullYear() - birthDate.getFullYear();
  const m = nowDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && nowDate.getDate() < birthDate.getDate())) ageValue -= 1;
  return ageValue;
}

function checkEligibility(userDoc, testDoc) {
  const rules = testDoc.eligibilityRules || {};
  if (rules.minAge) {
    const ageValue = calculateAge(userDoc.profile?.dob);
    if (ageValue === null) return { ok: false, reason: "DOB required for eligibility" };
    if (ageValue < rules.minAge) return { ok: false, reason: "Age not eligible" };
  }
  // plan-based access is enforced by Entitlement middleware for paid tests
  return { ok: true };
}

module.exports = { checkEligibility };
