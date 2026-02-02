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
 *   "weights": { "q1": 2, "q2": 1 },
 *   "categories": {
 *     "Depression": {
 *       "items": ["q1","q2"],
 *       "multiplier": 2,
 *       "bands": [{"min":0,"max":18,"label":"Normal"},{"min":20,"max":26,"label":"Mild"}]
 *     }
 *   }
 * }
 * @param {Object} scoringRules - Scoring configuration
 * @param {Object} answersObj - User's answers object
 * @returns {Object} - Score result with score, band, subscales, and categoryResults
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

  // Calculate subscales (backward compatibility)
  const subscalesOut = {};
  if (rules.subscales && typeof rules.subscales === "object") {
    for (const subKey of Object.keys(rules.subscales)) {
      const subItems = Array.isArray(rules.subscales[subKey]) ? rules.subscales[subKey] : [];
      subscalesOut[subKey] = subItems.reduce((s, it) => s + safeNumber(answers[it]), 0);
    }
  }

  // Calculate category results with bands
  const categoryResults = {};
  if (rules.categories && typeof rules.categories === "object") {
    for (const categoryName of Object.keys(rules.categories)) {
      const categoryConfig = rules.categories[categoryName];
      const categoryItems = Array.isArray(categoryConfig.items) ? categoryConfig.items : [];
      
      // Calculate raw category score (sum of answer values)
      let rawCategoryScore = 0;
      let categoryAnsweredCount = 0;
      for (const itemId of categoryItems) {
        const answerValue = answers[itemId];
        // Count as answered if value exists (even if 0)
        if (answerValue !== null && answerValue !== undefined && answerValue !== "") {
          categoryAnsweredCount++;
        }
        rawCategoryScore += safeNumber(answerValue);
      }
      
      // Apply multiplier to category score (default to 1 if not specified)
      const multiplier = safeNumber(categoryConfig.multiplier) || 1;
      const categoryScore = rawCategoryScore * multiplier;
      
      // Find band for category score (bands should account for multiplied score)
      let categoryBand = "";
      let categoryBandDescription = "";
      const categoryBands = Array.isArray(categoryConfig.bands) ? categoryConfig.bands : [];
      
      for (const bandItem of categoryBands) {
        if (typeof bandItem === "object" && 
            typeof bandItem.min === "number" && 
            typeof bandItem.max === "number") {
          if (categoryScore >= bandItem.min && categoryScore <= bandItem.max) {
            categoryBand = bandItem.label || "";
            categoryBandDescription = bandItem.description || "";
            break;
          }
        }
      }
      
      categoryResults[categoryName] = {
        score: categoryScore,
        rawScore: rawCategoryScore,
        multiplier: multiplier,
        band: categoryBand,
        bandDescription: categoryBandDescription,
        items: categoryItems,
        answeredCount: categoryAnsweredCount,
        totalItems: categoryItems.length
      };
    }
  }

  // Find band label based on overall score
  let bandLabel = "";
  let bandDescription = "";
  const bands = Array.isArray(rules.bands) ? rules.bands : [];
  for (const bandItem of bands) {
    if (typeof bandItem === "object" && 
        typeof bandItem.min === "number" && 
        typeof bandItem.max === "number") {
      if (totalScore >= bandItem.min && totalScore <= bandItem.max) {
        bandLabel = bandItem.label || "";
        bandDescription = bandItem.description || "";
        break;
      }
    }
  }

  return { 
    score: totalScore, 
    band: bandLabel,
    bandDescription: bandDescription,
    subscales: subscalesOut,
    categoryResults: Object.keys(categoryResults).length > 0 ? categoryResults : undefined,
    answeredCount,
    totalItems: items.length
  };
}

module.exports = { computeScore };
