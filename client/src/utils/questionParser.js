/**
 * Utility functions to parse and render questions from schemaJson
 */

/**
 * Parse schemaJson to extract questions array
 * Handles various schema formats
 * @param {Object} schemaJson - The schema JSON from test
 * @returns {Array} Array of question objects
 */
export function parseQuestions(schemaJson) {
  if (!schemaJson) return [];
  
  // If schemaJson is already an array
  if (Array.isArray(schemaJson)) {
    return schemaJson;
  }
  
  // If schemaJson has a questions property
  if (schemaJson.questions && Array.isArray(schemaJson.questions)) {
    return schemaJson.questions;
  }
  
  // If schemaJson has an items property
  if (schemaJson.items && Array.isArray(schemaJson.items)) {
    return schemaJson.items;
  }
  
  // If schemaJson is an object with question IDs as keys
  if (typeof schemaJson === 'object') {
    return Object.keys(schemaJson).map(key => ({
      id: key,
      ...schemaJson[key]
    }));
  }
  
  return [];
}

/**
 * Get question type from question object
 * @param {Object} question - Question object
 * @returns {string} Question type (radio, checkbox, text, etc.)
 */
export function getQuestionType(question) {
  if (!question) return 'radio';
  
  // Check explicit type field
  if (question.type) return question.type;
  
  // Infer from options
  if (question.options) {
    if (question.multiple) return 'checkbox';
    return 'radio';
  }
  
  // Default to radio
  return 'radio';
}

/**
 * Get options for a question
 * @param {Object} question - Question object
 * @returns {Array} Array of option objects with value and label
 */
export function getQuestionOptions(question) {
  if (!question) return [];
  
  // If options is already an array of objects
  if (Array.isArray(question.options)) {
    return question.options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return {
        value: opt.value || opt.id || opt.key,
        label: opt.label || opt.text || opt.value || opt.id || opt.key
      };
    });
  }
  
  // If options is an object (key-value pairs)
  if (typeof question.options === 'object') {
    return Object.keys(question.options).map(key => ({
      value: key,
      label: question.options[key]
    }));
  }
  
  return [];
}

/**
 * Get sub-questions if any
 * @param {Object} question - Question object
 * @returns {Array} Array of sub-question objects
 */
export function getSubQuestions(question) {
  if (!question) return [];
  
  if (question.subQuestions && Array.isArray(question.subQuestions)) {
    return question.subQuestions;
  }
  
  if (question.children && Array.isArray(question.children)) {
    return question.children;
  }
  
  return [];
}

/**
 * Check if question is required
 * @param {Object} question - Question object
 * @returns {boolean} Whether question is required
 */
export function isQuestionRequired(question) {
  if (!question) return false;
  return question.required !== false; // Default to true unless explicitly false
}

/**
 * Get question text/label
 * @param {Object} question - Question object
 * @returns {string} Question text
 */
export function getQuestionText(question) {
  if (!question) return '';
  return question.text || question.label || question.question || question.title || '';
}

/**
 * Get question ID
 * @param {Object} question - Question object
 * @param {number} index - Index if no ID is present
 * @returns {string} Question ID
 */
export function getQuestionId(question, index) {
  if (!question) return `q${index}`;
  return question.id || question.questionId || question.key || `q${index}`;
}

