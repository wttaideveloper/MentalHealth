/**
 * Schema Validation Service
 * Validates test schemas for structure, question types, and data integrity
 */

const { buildDependencyGraph, detectCircularDependencies } = require('./branching.service');

const VALID_QUESTION_TYPES = ['radio', 'checkbox', 'text', 'textarea', 'numeric', 'boolean', 'likert'];

/**
 * Validate a test schema
 * @param {Object} schemaJson - The schema JSON to validate
 * @returns {Object} - { valid: boolean, errors: Array<string>, warnings: Array<string> }
 */
function validateSchema(schemaJson) {
  const errors = [];
  const warnings = [];

  // Validate schema structure
  if (!schemaJson || typeof schemaJson !== 'object') {
    return {
      valid: false,
      errors: ['Schema must be an object'],
      warnings: []
    };
  }

  // Check for questions array
  if (!schemaJson.questions) {
    return {
      valid: false,
      errors: ['Schema must contain a "questions" array'],
      warnings: []
    };
  }

  if (!Array.isArray(schemaJson.questions)) {
    return {
      valid: false,
      errors: ['"questions" must be an array'],
      warnings: []
    };
  }

  if (schemaJson.questions.length === 0) {
    return {
      valid: false,
      errors: ['Schema must contain at least one question'],
      warnings: []
    };
  }

  // Validate each question
  const questionIds = new Set();
  const questionOrders = [];

  schemaJson.questions.forEach((question, index) => {
    const questionNum = index + 1;
    const prefix = `Question ${questionNum}`;

    // Validate question ID
    if (!question.id) {
      errors.push(`${prefix}: Missing required field "id"`);
    } else if (typeof question.id !== 'string') {
      errors.push(`${prefix}: "id" must be a string`);
    } else if (question.id.trim() === '') {
      errors.push(`${prefix}: "id" cannot be empty`);
    } else if (questionIds.has(question.id)) {
      errors.push(`${prefix}: Duplicate question ID "${question.id}"`);
    } else {
      questionIds.add(question.id);
    }

    // Validate question text
    if (!question.text) {
      errors.push(`${prefix}: Missing required field "text"`);
    } else if (typeof question.text !== 'string') {
      errors.push(`${prefix}: "text" must be a string`);
    } else if (question.text.trim() === '') {
      errors.push(`${prefix}: "text" cannot be empty`);
    }

    // Validate question type
    const questionType = question.type || 'radio';
    if (!VALID_QUESTION_TYPES.includes(questionType)) {
      errors.push(`${prefix}: Invalid type "${questionType}". Valid types: ${VALID_QUESTION_TYPES.join(', ')}`);
    }

    // Validate options based on question type
    if (['radio', 'checkbox', 'likert'].includes(questionType)) {
      if (!question.options || !Array.isArray(question.options)) {
        errors.push(`${prefix}: Type "${questionType}" requires an "options" array`);
      } else if (question.options.length < 2) {
        errors.push(`${prefix}: Type "${questionType}" requires at least 2 options`);
      } else {
        // Validate each option
        question.options.forEach((option, optIndex) => {
          const optPrefix = `${prefix}, Option ${optIndex + 1}`;
          
          if (option.value === undefined || option.value === null) {
            errors.push(`${optPrefix}: Missing required field "value"`);
          }
          
          if (!option.label || typeof option.label !== 'string' || option.label.trim() === '') {
            errors.push(`${optPrefix}: Missing or invalid "label"`);
          }
        });
      }
    }

    // Validate numeric question constraints
    if (questionType === 'numeric') {
      if (question.min !== undefined && typeof question.min !== 'number') {
        errors.push(`${prefix}: "min" must be a number`);
      }
      if (question.max !== undefined && typeof question.max !== 'number') {
        errors.push(`${prefix}: "max" must be a number`);
      }
      if (question.min !== undefined && question.max !== undefined && question.min > question.max) {
        errors.push(`${prefix}: "min" (${question.min}) cannot be greater than "max" (${question.max})`);
      }
      if (question.step !== undefined && typeof question.step !== 'number') {
        errors.push(`${prefix}: "step" must be a number`);
      }
    }

    // Validate text/textarea constraints
    if (['text', 'textarea'].includes(questionType)) {
      if (question.maxLength !== undefined && typeof question.maxLength !== 'number') {
        errors.push(`${prefix}: "maxLength" must be a number`);
      }
      if (question.maxLength !== undefined && question.maxLength < 1) {
        errors.push(`${prefix}: "maxLength" must be at least 1`);
      }
      if (questionType === 'textarea' && question.rows !== undefined && typeof question.rows !== 'number') {
        errors.push(`${prefix}: "rows" must be a number`);
      }
    }

    // Validate order field
    if (question.order !== undefined) {
      if (typeof question.order !== 'number') {
        warnings.push(`${prefix}: "order" should be a number`);
      } else {
        questionOrders.push({ id: question.id, order: question.order });
      }
    }

    // Validate required field
    if (question.required !== undefined && typeof question.required !== 'boolean') {
      warnings.push(`${prefix}: "required" should be a boolean`);
    }

    // Validate isCritical field
    if (question.isCritical !== undefined && typeof question.isCritical !== 'boolean') {
      warnings.push(`${prefix}: "isCritical" should be a boolean`);
    }

    // Validate helpText
    if (question.helpText !== undefined && typeof question.helpText !== 'string') {
      warnings.push(`${prefix}: "helpText" should be a string`);
    }

    // Critical question must have helpText
    if (question.isCritical === true && (!question.helpText || question.helpText.trim() === '')) {
      errors.push(`${prefix}: Critical questions must have "helpText" for safety information`);
    }

    // Validate show_if condition structure (if present)
    const showIf = question.show_if || question.showIf;
    if (showIf !== undefined && showIf !== null) {
      // Validate show_if is object or array
      if (typeof showIf !== 'object' && !Array.isArray(showIf)) {
        errors.push(`${prefix}: "show_if" must be an object or array`);
      } else if (typeof showIf === 'object' && !Array.isArray(showIf)) {
        // Validate simple condition
        if (showIf.questionId || showIf.question) {
          const depQuestionId = showIf.questionId || showIf.question;
          // Check if referenced question exists
          const depExists = schemaJson.questions.some(q => q.id === depQuestionId);
          if (!depExists) {
            errors.push(`${prefix}: "show_if" references non-existent question "${depQuestionId}"`);
          }
        }
        // Validate AND/OR conditions
        if (showIf.and && Array.isArray(showIf.and)) {
          showIf.and.forEach((cond, condIdx) => {
            if (cond && typeof cond === 'object' && (cond.questionId || cond.question)) {
              const depQuestionId = cond.questionId || cond.question;
              const depExists = schemaJson.questions.some(q => q.id === depQuestionId);
              if (!depExists) {
                errors.push(`${prefix}: "show_if.and[${condIdx}]" references non-existent question "${depQuestionId}"`);
              }
            }
          });
        }
        if (showIf.or && Array.isArray(showIf.or)) {
          showIf.or.forEach((cond, condIdx) => {
            if (cond && typeof cond === 'object' && (cond.questionId || cond.question)) {
              const depQuestionId = cond.questionId || cond.question;
              const depExists = schemaJson.questions.some(q => q.id === depQuestionId);
              if (!depExists) {
                errors.push(`${prefix}: "show_if.or[${condIdx}]" references non-existent question "${depQuestionId}"`);
              }
            }
          });
        }
      } else if (Array.isArray(showIf)) {
        // Validate array of conditions
        showIf.forEach((cond, condIdx) => {
          if (cond && typeof cond === 'object' && (cond.questionId || cond.question)) {
            const depQuestionId = cond.questionId || cond.question;
            const depExists = schemaJson.questions.some(q => q.id === depQuestionId);
            if (!depExists) {
              errors.push(`${prefix}: "show_if[${condIdx}]" references non-existent question "${depQuestionId}"`);
            }
          }
        });
      }
    }
  });

  // Check for circular dependencies in show_if conditions
  const dependencyGraph = buildDependencyGraph(schemaJson.questions);
  const cycleCheck = detectCircularDependencies(dependencyGraph);
  if (cycleCheck.hasCycle) {
    cycleCheck.cycles.forEach((cycle, cycleIdx) => {
      const cycleStr = cycle.join(' → ');
      errors.push(`Circular dependency detected in show_if conditions (Cycle ${cycleIdx + 1}): ${cycleStr}`);
      warnings.push(`Circular dependency in show_if: ${cycleStr}. This will cause infinite loops.`);
    });
  }

  // Check for duplicate orders
  const orderCounts = {};
  questionOrders.forEach(({ id, order }) => {
    if (!orderCounts[order]) {
      orderCounts[order] = [];
    }
    orderCounts[order].push(id);
  });

  Object.keys(orderCounts).forEach(order => {
    if (orderCounts[order].length > 1) {
      warnings.push(`Multiple questions have the same order value (${order}): ${orderCounts[order].join(', ')}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate scoring rules
 * @param {Object} scoringRules - Scoring rules to validate
 * @param {Array<string>} questionIds - Array of valid question IDs
 * @returns {Object} - { valid: boolean, errors: Array<string> }
 */
function validateScoringRules(scoringRules, questionIds) {
  const errors = [];

  if (!scoringRules || typeof scoringRules !== 'object') {
    return { valid: true, errors: [] }; // Scoring rules are optional
  }

  // Validate type
  const validTypes = ['sum', 'weighted_sum'];
  if (scoringRules.type && !validTypes.includes(scoringRules.type)) {
    errors.push(`Invalid scoring type "${scoringRules.type}". Valid types: ${validTypes.join(', ')}`);
  }

  // Validate items array
  if (scoringRules.items) {
    if (!Array.isArray(scoringRules.items)) {
      errors.push('"items" in scoringRules must be an array');
    } else {
      scoringRules.items.forEach((itemId, index) => {
        if (!questionIds.includes(itemId)) {
          errors.push(`Scoring item ${index + 1} ("${itemId}") does not match any question ID`);
        }
      });
    }
  }

  // Validate weights
  if (scoringRules.weights) {
    if (typeof scoringRules.weights !== 'object') {
      errors.push('"weights" in scoringRules must be an object');
    } else {
      Object.keys(scoringRules.weights).forEach(questionId => {
        if (!questionIds.includes(questionId)) {
          errors.push(`Weight for question "${questionId}" does not match any question ID`);
        }
        if (typeof scoringRules.weights[questionId] !== 'number') {
          errors.push(`Weight for question "${questionId}" must be a number`);
        }
      });
    }
  }

  // Validate bands
  if (scoringRules.bands) {
    if (!Array.isArray(scoringRules.bands)) {
      errors.push('"bands" in scoringRules must be an array');
    } else {
      scoringRules.bands.forEach((band, index) => {
        if (typeof band !== 'object') {
          errors.push(`Band ${index + 1} must be an object`);
        } else {
          if (band.min === undefined || typeof band.min !== 'number') {
            errors.push(`Band ${index + 1}: "min" is required and must be a number`);
          }
          if (band.max === undefined || typeof band.max !== 'number') {
            errors.push(`Band ${index + 1}: "max" is required and must be a number`);
          }
          if (band.min !== undefined && band.max !== undefined && band.min > band.max) {
            errors.push(`Band ${index + 1}: "min" (${band.min}) cannot be greater than "max" (${band.max})`);
          }
          if (!band.label || typeof band.label !== 'string') {
            errors.push(`Band ${index + 1}: "label" is required and must be a string`);
          }
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate risk rules
 * @param {Object} riskRules - Risk rules to validate
 * @param {Array<string>} questionIds - Array of valid question IDs
 * @returns {Object} - { valid: boolean, errors: Array<string> }
 */
function validateRiskRules(riskRules, questionIds) {
  const errors = [];

  if (!riskRules || typeof riskRules !== 'object') {
    return { valid: true, errors: [] }; // Risk rules are optional
  }

  // Validate triggers
  if (riskRules.triggers) {
    if (!Array.isArray(riskRules.triggers)) {
      errors.push('"triggers" in riskRules must be an array');
    } else {
      riskRules.triggers.forEach((trigger, index) => {
        if (typeof trigger !== 'object') {
          errors.push(`Trigger ${index + 1} must be an object`);
        } else {
          if (!trigger.questionId) {
            errors.push(`Trigger ${index + 1}: "questionId" is required`);
          } else if (!questionIds.includes(trigger.questionId)) {
            errors.push(`Trigger ${index + 1}: Question ID "${trigger.questionId}" does not exist`);
          }

          // Validate at least one condition operator
          const validOperators = ['equals', 'not_equals', 'gte', 'lte', 'gt', 'lt', 'in', 'contains'];
          const hasOperator = validOperators.some(op => trigger[op] !== undefined);
          
          if (!hasOperator) {
            errors.push(`Trigger ${index + 1}: Must have at least one condition operator (${validOperators.join(', ')})`);
          }

          if (!trigger.flag || typeof trigger.flag !== 'string') {
            errors.push(`Trigger ${index + 1}: "flag" is required and must be a string`);
          }
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate complete test data
 * @param {Object} testData - Complete test data including schemaJson, scoringRules, riskRules
 * @returns {Object} - { valid: boolean, errors: Array<string>, warnings: Array<string> }
 */
function validateTestData(testData) {
  const errors = [];
  const warnings = [];

  // Validate basic required fields
  if (!testData.title || typeof testData.title !== 'string' || testData.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!testData.schemaJson) {
    errors.push('schemaJson is required');
    return { valid: false, errors, warnings };
  }

  // Validate schema
  const schemaValidation = validateSchema(testData.schemaJson);
  errors.push(...schemaValidation.errors);
  warnings.push(...schemaValidation.warnings);

  // Get question IDs for scoring and risk rule validation
  const questionIds = schemaValidation.valid && testData.schemaJson.questions
    ? testData.schemaJson.questions.map(q => q.id).filter(Boolean)
    : [];

  // Validate scoring rules
  if (testData.scoringRules) {
    const scoringValidation = validateScoringRules(testData.scoringRules, questionIds);
    errors.push(...scoringValidation.errors);
  }

  // Validate risk rules
  if (testData.riskRules) {
    const riskValidation = validateRiskRules(testData.riskRules, questionIds);
    errors.push(...riskValidation.errors);
  }

  // Validate eligibility rules
  if (testData.eligibilityRules) {
    const eligibilityValidation = validateEligibilityRules(testData.eligibilityRules);
    errors.push(...eligibilityValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate eligibility rules
 * @param {Object} eligibilityRules - Eligibility rules to validate
 * @returns {Object} - { valid: boolean, errors: Array<string> }
 */
function validateEligibilityRules(eligibilityRules) {
  const errors = [];

  if (!eligibilityRules || typeof eligibilityRules !== 'object') {
    return { valid: true, errors: [] }; // Eligibility rules are optional
  }

  // Support legacy format: simple minAge
  if (eligibilityRules.minAge !== undefined) {
    if (typeof eligibilityRules.minAge !== 'number' || eligibilityRules.minAge < 0) {
      errors.push('"minAge" must be a non-negative number');
    }
    return { valid: errors.length === 0, errors };
  }

  // New format: conditions with AND/OR
  if (eligibilityRules.conditions) {
    if (!Array.isArray(eligibilityRules.conditions)) {
      errors.push('"conditions" in eligibilityRules must be an array');
    } else if (eligibilityRules.conditions.length === 0) {
      errors.push('"conditions" array cannot be empty');
    } else {
      // Validate operator
      if (eligibilityRules.operator && !['AND', 'OR', 'and', 'or'].includes(eligibilityRules.operator)) {
        errors.push('"operator" must be either "AND" or "OR"');
      }

      // Validate each condition
      eligibilityRules.conditions.forEach((condition, index) => {
        if (typeof condition !== 'object') {
          errors.push(`Condition ${index + 1} must be an object`);
          return;
        }

        // Age condition
        if (condition.type === 'age' || condition.field === 'age') {
          if (condition.minAge !== undefined && (typeof condition.minAge !== 'number' || condition.minAge < 0)) {
            errors.push(`Condition ${index + 1}: "minAge" must be a non-negative number`);
          }
          if (condition.maxAge !== undefined && (typeof condition.maxAge !== 'number' || condition.maxAge < 0)) {
            errors.push(`Condition ${index + 1}: "maxAge" must be a non-negative number`);
          }
          if (condition.minAge !== undefined && condition.maxAge !== undefined && condition.minAge > condition.maxAge) {
            errors.push(`Condition ${index + 1}: "minAge" (${condition.minAge}) cannot be greater than "maxAge" (${condition.maxAge})`);
          }
        }

        // Gender condition
        if (condition.type === 'gender' || condition.field === 'gender') {
          if (!condition.value && !condition.equals) {
            errors.push(`Condition ${index + 1}: Gender condition requires "value" or "equals" field`);
          }
        }

        // Custom field condition
        if (condition.field && condition.field !== 'age' && condition.field !== 'gender') {
          if (!condition.operator && !condition.equals && !condition.not_equals && !condition.in) {
            errors.push(`Condition ${index + 1}: Custom field condition requires an operator (equals, not_equals, in)`);
          }
          if (condition.operator && !['equals', 'not_equals', 'in'].includes(condition.operator)) {
            errors.push(`Condition ${index + 1}: Invalid operator "${condition.operator}". Valid operators: equals, not_equals, in`);
          }
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateSchema,
  validateScoringRules,
  validateRiskRules,
  validateEligibilityRules,
  validateTestData,
  VALID_QUESTION_TYPES
};

