/**
 * Frontend Schema Validation Utility
 * Validates test schemas before submission
 */

import { buildDependencyGraph, detectCircularDependencies } from './branchingEngine';

const VALID_QUESTION_TYPES = ['radio', 'checkbox', 'text', 'textarea', 'numeric', 'boolean', 'likert'];

/**
 * Validate a test schema
 * @param {Object} schemaJson - The schema JSON to validate
 * @returns {Object} - { valid: boolean, errors: Array<string>, warnings: Array<string> }
 */
export function validateSchema(schemaJson) {
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
  const questionErrors = {}; // Map question ID to errors for highlighting

  schemaJson.questions.forEach((question, index) => {
    const questionNum = index + 1;
    const prefix = `Question ${questionNum}`;
    const questionErrorsList = [];

    // Validate question ID
    if (!question.id) {
      const error = `${prefix}: Missing required field "id"`;
      errors.push(error);
      questionErrorsList.push(error);
    } else if (typeof question.id !== 'string') {
      const error = `${prefix}: "id" must be a string`;
      errors.push(error);
      questionErrorsList.push(error);
    } else if (question.id.trim() === '') {
      const error = `${prefix}: "id" cannot be empty`;
      errors.push(error);
      questionErrorsList.push(error);
    } else if (questionIds.has(question.id)) {
      const error = `${prefix}: Duplicate question ID "${question.id}"`;
      errors.push(error);
      questionErrorsList.push(error);
    } else {
      questionIds.add(question.id);
    }

    // Validate question text
    if (!question.text) {
      const error = `${prefix}: Missing required field "text"`;
      errors.push(error);
      questionErrorsList.push(error);
    } else if (typeof question.text !== 'string') {
      const error = `${prefix}: "text" must be a string`;
      errors.push(error);
      questionErrorsList.push(error);
    } else if (question.text.trim() === '') {
      const error = `${prefix}: "text" cannot be empty`;
      errors.push(error);
      questionErrorsList.push(error);
    }

    // Validate question type
    const questionType = question.type || 'radio';
    if (!VALID_QUESTION_TYPES.includes(questionType)) {
      const error = `${prefix}: Invalid type "${questionType}". Valid types: ${VALID_QUESTION_TYPES.join(', ')}`;
      errors.push(error);
      questionErrorsList.push(error);
    }

    // Validate options based on question type
    if (['radio', 'checkbox', 'likert'].includes(questionType)) {
      if (!question.options || !Array.isArray(question.options)) {
        const error = `${prefix}: Type "${questionType}" requires an "options" array`;
        errors.push(error);
        questionErrorsList.push(error);
      } else if (question.options.length < 2) {
        const error = `${prefix}: Type "${questionType}" requires at least 2 options`;
        errors.push(error);
        questionErrorsList.push(error);
      } else {
        // Validate each option
        question.options.forEach((option, optIndex) => {
          const optPrefix = `${prefix}, Option ${optIndex + 1}`;
          
          if (option.value === undefined || option.value === null) {
            const error = `${optPrefix}: Missing required field "value"`;
            errors.push(error);
            questionErrorsList.push(error);
          }
          
          if (!option.label || typeof option.label !== 'string' || option.label.trim() === '') {
            const error = `${optPrefix}: Missing or invalid "label"`;
            errors.push(error);
            questionErrorsList.push(error);
          }
        });
      }
    }

    // Validate numeric question constraints
    if (questionType === 'numeric') {
      if (question.min !== undefined && typeof question.min !== 'number') {
        const error = `${prefix}: "min" must be a number`;
        errors.push(error);
        questionErrorsList.push(error);
      }
      if (question.max !== undefined && typeof question.max !== 'number') {
        const error = `${prefix}: "max" must be a number`;
        errors.push(error);
        questionErrorsList.push(error);
      }
      if (question.min !== undefined && question.max !== undefined && question.min > question.max) {
        const error = `${prefix}: "min" (${question.min}) cannot be greater than "max" (${question.max})`;
        errors.push(error);
        questionErrorsList.push(error);
      }
    }

    // Validate text/textarea constraints
    if (['text', 'textarea'].includes(questionType)) {
      if (question.maxLength !== undefined && typeof question.maxLength !== 'number') {
        const error = `${prefix}: "maxLength" must be a number`;
        errors.push(error);
        questionErrorsList.push(error);
      }
    }

    // Critical question must have helpText
    if (question.isCritical === true && (!question.helpText || question.helpText.trim() === '')) {
      const error = `${prefix}: Critical questions must have "helpText" for safety information`;
      errors.push(error);
      questionErrorsList.push(error);
    }

    // Validate show_if condition structure (if present)
    const showIf = question.show_if || question.showIf;
    if (showIf !== undefined && showIf !== null) {
      // Validate show_if is object or array
      if (typeof showIf !== 'object' && !Array.isArray(showIf)) {
        const error = `${prefix}: "show_if" must be an object or array`;
        errors.push(error);
        questionErrorsList.push(error);
      } else if (typeof showIf === 'object' && !Array.isArray(showIf)) {
        // Validate simple condition
        if (showIf.questionId || showIf.question) {
          const depQuestionId = showIf.questionId || showIf.question;
          // Check if referenced question exists
          const depExists = schemaJson.questions.some(q => q.id === depQuestionId);
          if (!depExists) {
            const error = `${prefix}: "show_if" references non-existent question "${depQuestionId}"`;
            errors.push(error);
            questionErrorsList.push(error);
          }
        }
        // Validate AND/OR conditions
        if (showIf.and && Array.isArray(showIf.and)) {
          showIf.and.forEach((cond, condIdx) => {
            if (cond && typeof cond === 'object' && (cond.questionId || cond.question)) {
              const depQuestionId = cond.questionId || cond.question;
              const depExists = schemaJson.questions.some(q => q.id === depQuestionId);
              if (!depExists) {
                const error = `${prefix}: "show_if.and[${condIdx}]" references non-existent question "${depQuestionId}"`;
                errors.push(error);
                questionErrorsList.push(error);
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
                const error = `${prefix}: "show_if.or[${condIdx}]" references non-existent question "${depQuestionId}"`;
                errors.push(error);
                questionErrorsList.push(error);
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
              const error = `${prefix}: "show_if[${condIdx}]" references non-existent question "${depQuestionId}"`;
              errors.push(error);
              questionErrorsList.push(error);
            }
          }
        });
      }
    }

    // Store errors for this question
    if (questionErrorsList.length > 0 && question.id) {
      questionErrors[question.id] = questionErrorsList;
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

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    questionErrors // Map of question ID to errors for highlighting
  };
}

/**
 * Validate complete test data
 * @param {Object} testData - Complete test data
 * @returns {Object} - { valid: boolean, errors: Array<string>, warnings: Array<string>, questionErrors: Object }
 */
export function validateTestData(testData) {
  const errors = [];
  const warnings = [];

  // Validate basic required fields
  if (!testData.title || typeof testData.title !== 'string' || testData.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!testData.schemaJson) {
    errors.push('schemaJson is required');
    return { valid: false, errors, warnings, questionErrors: {} };
  }

  // Validate schema
  const schemaValidation = validateSchema(testData.schemaJson);
  errors.push(...schemaValidation.errors);
  warnings.push(...schemaValidation.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    questionErrors: schemaValidation.questionErrors || {}
  };
}

