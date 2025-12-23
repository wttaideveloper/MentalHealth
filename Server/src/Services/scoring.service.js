function safeNumber(v) {
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
 */
function computeScore(scoringRules, answersObj) {
  const rules = scoringRules || {};
  const scoreType = rules.type || "sum";
  const items = Array.isArray(rules.items) ? rules.items : Object.keys(answersObj || {});
  const weights = rules.weights || {};

  let totalScore = 0;

  if (scoreType === "weighted_sum") {
    for (const itemId of items) {
      totalScore += safeNumber(answersObj[itemId]) * safeNumber(weights[itemId] ?? 1);
    }
  } else {
    for (const itemId of items) {
      totalScore += safeNumber(answersObj[itemId]);
    }
  }

  const subscalesOut = {};
  if (rules.subscales) {
    for (const subKey of Object.keys(rules.subscales)) {
      const subItems = rules.subscales[subKey] || [];
      subscalesOut[subKey] = subItems.reduce((s, it) => s + safeNumber(answersObj[it]), 0);
    }
  }

  let bandLabel = "";
  const bands = Array.isArray(rules.bands) ? rules.bands : [];
  for (const bandItem of bands) {
    if (totalScore >= bandItem.min && totalScore <= bandItem.max) {
      bandLabel = bandItem.label;
      break;
    }
  }

  return { score: totalScore, band: bandLabel, subscales: subscalesOut };
}

module.exports = { computeScore };
