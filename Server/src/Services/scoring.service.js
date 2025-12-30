/**
 * Safely convert a value to a number
 * Returns 0 if value is not a valid number
 * @param {*} v - Value to convert
 * @returns {number} - Valid number or 0
 */
function safeNumber(v) {
  if (v === null || v === undefined || v === "") {
    return 0;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * scoringRules example:
 * {
 *   "type":"sum",
 *   "items":["q1","q2","q3"],
 *   "bands":[{"min":0,"max":5,"label":"Low"},{"min":6,"max":10,"label":"Moderate"}],
 *   "subscales": { "A":["q1","q2"], "B":["q3"] },
 *   "weights": { "q1": 2, "q2": 1 }
 * }
 * @param {Object} scoringRules - Scoring configuration
 * @param {Object} answersObj - User's answers object
 * @returns {Object} - Score result with score, band, and subscales
 */
function computeScore(scoringRules, answersObj) {
  const rules = scoringRules || {};
  const answers = answersObj || {};
  const scoreType = rules.type || "sum";
  
  // Get list of items to score
  // If items array is specified, use it; otherwise use all keys from answers
  const items = Array.isArray(rules.items) ? rules.items : Object.keys(answers);
  const weights = rules.weights || {};

  let totalScore = 0;
  let answeredCount = 0;

  // Calculate total score
  if (scoreType === "weighted_sum") {
    for (const itemId of items) {
      const answerValue = answers[itemId];
      // Count as answered if value exists (even if 0)
      if (answerValue !== null && answerValue !== undefined && answerValue !== "") {
        answeredCount++;
      }
      totalScore += safeNumber(answerValue) * safeNumber(weights[itemId] ?? 1);
    }
  } else {
    // Default: sum
    for (const itemId of items) {
      const answerValue = answers[itemId];
      // Count as answered if value exists (even if 0)
      if (answerValue !== null && answerValue !== undefined && answerValue !== "") {
        answeredCount++;
      }
      totalScore += safeNumber(answerValue);
    }
  }

  // Calculate subscales
  const subscalesOut = {};
  if (rules.subscales && typeof rules.subscales === "object") {
    for (const subKey of Object.keys(rules.subscales)) {
      const subItems = Array.isArray(rules.subscales[subKey]) ? rules.subscales[subKey] : [];
      subscalesOut[subKey] = subItems.reduce((s, it) => s + safeNumber(answers[it]), 0);
    }
  }

  // Find band label based on score
  let bandLabel = "";
  const bands = Array.isArray(rules.bands) ? rules.bands : [];
  for (const bandItem of bands) {
    if (typeof bandItem === "object" && 
        typeof bandItem.min === "number" && 
        typeof bandItem.max === "number") {
      if (totalScore >= bandItem.min && totalScore <= bandItem.max) {
        bandLabel = bandItem.label || "";
        break;
      }
    }
  }

  return { 
    score: totalScore, 
    band: bandLabel, 
    subscales: subscalesOut,
    answeredCount,
    totalItems: items.length
  };
}

module.exports = { computeScore };
