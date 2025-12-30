/**
 * Evaluate risk flags based on risk rules and user answers
 * @param {Object} riskRules - Risk evaluation configuration
 * @param {Object} answersObj - User's answers object
 * @returns {Object} - Risk evaluation result with hasRisk, flags, and helpText
 */
function evaluateRisk(riskRules, answersObj) {
  const rules = riskRules || {};
  const answers = answersObj || {};
  const triggers = Array.isArray(rules.triggers) ? rules.triggers : [];

  // trigger example: 
  // { "questionId":"q9", "equals":4, "flag":"self_harm", "helpText":"Please seek immediate help" }
  // { "questionId":"q10", "gte":5, "flag":"high_anxiety", "helpText":"Consider professional support" }
  const flagsOut = {};
  const triggeredFlags = [];
  
  for (const triggerItem of triggers) {
    if (!triggerItem.questionId) continue;
    
    const answerValue = answers[triggerItem.questionId];
    const flagName = triggerItem.flag || "risk";
    let triggered = false;
    
    // Check equals condition
    if (typeof triggerItem.equals !== "undefined" && answerValue === triggerItem.equals) {
      triggered = true;
    }
    
    // Check greater than or equal condition
    if (typeof triggerItem.gte !== "undefined") {
      const numValue = Number(answerValue);
      if (!isNaN(numValue) && numValue >= triggerItem.gte) {
        triggered = true;
      }
    }
    
    // Check less than or equal condition
    if (typeof triggerItem.lte !== "undefined") {
      const numValue = Number(answerValue);
      if (!isNaN(numValue) && numValue <= triggerItem.lte) {
        triggered = true;
      }
    }
    
    if (triggered) {
      flagsOut[flagName] = true;
      triggeredFlags.push({
        flag: flagName,
        questionId: triggerItem.questionId,
        helpText: triggerItem.helpText || rules.helpText || ""
      });
    }
  }

  const hasRisk = Object.keys(flagsOut).length > 0;
  
  // Build help text from triggered flags
  let helpText = rules.helpText || "";
  if (triggeredFlags.length > 0) {
    const flagHelpTexts = triggeredFlags
      .map(t => t.helpText)
      .filter(ht => ht && ht.trim())
      .filter((ht, idx, arr) => arr.indexOf(ht) === idx); // Remove duplicates
    
    if (flagHelpTexts.length > 0) {
      if (helpText) {
        helpText += "\n\n" + flagHelpTexts.join("\n");
      } else {
        helpText = flagHelpTexts.join("\n");
      }
    }
  }
  
  return { 
    hasRisk, 
    flags: flagsOut, 
    helpText: helpText.trim(),
    triggeredFlags: triggeredFlags.map(t => ({
      flag: t.flag,
      questionId: t.questionId
    }))
  };
}

module.exports = { evaluateRisk };
