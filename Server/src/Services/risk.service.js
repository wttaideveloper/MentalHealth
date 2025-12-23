function evaluateRisk(riskRules, answersObj) {
  const rules = riskRules || {};
  const triggers = Array.isArray(rules.triggers) ? rules.triggers : [];

  // trigger example: { "questionId":"q9", "equals":4, "flag":"self_harm" }
  const flagsOut = {};
  for (const triggerItem of triggers) {
    const answerValue = answersObj?.[triggerItem.questionId];
    if (typeof triggerItem.equals !== "undefined" && answerValue === triggerItem.equals) {
      flagsOut[triggerItem.flag || "risk"] = true;
    }
    if (typeof triggerItem.gte !== "undefined" && Number(answerValue) >= triggerItem.gte) {
      flagsOut[triggerItem.flag || "risk"] = true;
    }
  }

  const hasRisk = Object.keys(flagsOut).length > 0;
  return { hasRisk, flags: flagsOut, helpText: rules.helpText || "" };
}

module.exports = { evaluateRisk };
