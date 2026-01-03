/**
 * Calculate age from date of birth
 * @param {Date|string} dobValue - Date of birth
 * @returns {number|null} - Age in years or null if invalid
 */
function calculateAge(dobValue) {
  if (!dobValue) return null;
  const nowDate = new Date();
  const birthDate = new Date(dobValue);
  if (isNaN(birthDate.getTime())) return null;
  
  let ageValue = nowDate.getFullYear() - birthDate.getFullYear();
  const m = nowDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && nowDate.getDate() < birthDate.getDate())) ageValue -= 1;
  return ageValue;
}

/**
 * Evaluate a single eligibility condition
 * @param {Object} condition - Condition object
 * @param {Object} userDoc - User document
 * @param {Object} participantInfo - Participant info for anonymous users
 * @returns {Object} - { passed: boolean, reason: string }
 */
function evaluateCondition(condition, userDoc, participantInfo = null) {
  // Use participantInfo if provided (for anonymous users), otherwise use userDoc
  const userData = participantInfo || userDoc;
  const profile = participantInfo ? participantInfo : (userDoc?.profile || {});

  // Age conditions
  if (condition.field === 'age' || condition.type === 'age') {
    const ageValue = calculateAge(profile.dob || participantInfo?.dateOfBirth);
    
    if (ageValue === null) {
      return { passed: false, reason: "Date of birth is required for age eligibility check" };
    }

    if (condition.minAge !== undefined && ageValue < condition.minAge) {
      return { passed: false, reason: `Minimum age requirement is ${condition.minAge} years. You are ${ageValue} years old.` };
    }

    if (condition.maxAge !== undefined && ageValue > condition.maxAge) {
      return { passed: false, reason: `Maximum age requirement is ${condition.maxAge} years. You are ${ageValue} years old.` };
    }

    return { passed: true };
  }

  // Gender condition
  if (condition.field === 'gender' || condition.type === 'gender') {
    const userGender = (profile.gender || participantInfo?.gender || '').toLowerCase();
    const requiredGender = (condition.value || condition.equals || '').toLowerCase();
    
    if (!userGender) {
      return { passed: false, reason: "Gender information is required for eligibility check" };
    }

    if (userGender !== requiredGender) {
      return { passed: false, reason: `This assessment is only available for ${requiredGender}.` };
    }

    return { passed: true };
  }

  // Custom field conditions
  if (condition.field) {
    const fieldValue = userData[condition.field] || profile[condition.field];
    const conditionValue = condition.value || condition.equals;

    if (condition.operator === 'equals' || condition.equals !== undefined) {
      if (String(fieldValue).toLowerCase() !== String(conditionValue).toLowerCase()) {
        return { passed: false, reason: `Field "${condition.field}" does not match required value` };
      }
    }

    if (condition.operator === 'not_equals' || condition.not_equals !== undefined) {
      if (String(fieldValue).toLowerCase() === String(conditionValue).toLowerCase()) {
        return { passed: false, reason: `Field "${condition.field}" must not equal the specified value` };
      }
    }

    if (condition.operator === 'in' || condition.in !== undefined) {
      const allowedValues = Array.isArray(condition.in) ? condition.in : [condition.in];
      if (!allowedValues.includes(fieldValue)) {
        return { passed: false, reason: `Field "${condition.field}" value is not in the allowed list` };
      }
    }

    return { passed: true };
  }

  // Default: condition passed if no specific checks
  return { passed: true };
}

/**
 * Evaluate eligibility rules with AND/OR support
 * @param {Object} rules - Eligibility rules object
 * @param {Object} userDoc - User document
 * @param {Object} participantInfo - Participant info for anonymous users (optional)
 * @returns {Object} - { ok: boolean, reason: string, details: Array }
 */
function checkEligibility(userDoc, testDoc, participantInfo = null) {
  const rules = testDoc.eligibilityRules || {};

  // If no rules, user is eligible
  if (!rules || Object.keys(rules).length === 0) {
    return { ok: true };
  }

  // Support legacy format: simple minAge
  if (rules.minAge !== undefined && !rules.conditions && !rules.operator) {
    const ageValue = calculateAge(participantInfo?.dateOfBirth || userDoc.profile?.dob);
    if (ageValue === null) {
      return { ok: false, reason: "Date of birth is required for eligibility check" };
    }
    if (ageValue < rules.minAge) {
      return { ok: false, reason: `Minimum age requirement is ${rules.minAge} years. You are ${ageValue} years old.` };
    }
    return { ok: true };
  }

  // New format: conditions with AND/OR
  const conditions = rules.conditions || [];
  const operator = rules.operator || 'AND'; // Default to AND

  if (conditions.length === 0) {
    return { ok: true };
  }

  const results = [];
  const failedReasons = [];

  // Evaluate all conditions
  for (const condition of conditions) {
    const result = evaluateCondition(condition, userDoc, participantInfo);
    results.push(result.passed);
    if (!result.passed) {
      failedReasons.push(result.reason);
    }
  }

  // Apply AND/OR logic
  let passed = false;
  if (operator.toUpperCase() === 'AND') {
    passed = results.every(r => r === true);
  } else if (operator.toUpperCase() === 'OR') {
    passed = results.some(r => r === true);
  } else {
    // Default to AND if operator is invalid
    passed = results.every(r => r === true);
  }

  if (!passed) {
    const reason = operator.toUpperCase() === 'AND' 
      ? failedReasons.join('; ')
      : `None of the eligibility conditions were met. ${failedReasons[0] || 'Eligibility check failed.'}`;
    
    return { 
      ok: false, 
      reason,
      details: failedReasons
    };
  }

  return { ok: true };
}

module.exports = { 
  checkEligibility,
  calculateAge,
  evaluateCondition
};
