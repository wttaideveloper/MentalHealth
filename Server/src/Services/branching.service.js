/**
 * Branching Service
 * Evaluates show_if conditions for dynamic question visibility
 */

/**
 * Safely convert a value to a number
 * @param {*} v - Value to convert
 * @returns {number|null} - Number or null if not a valid number
 */
function safeNumber(v) {
  if (v === null || v === undefined || v === "") {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Safely convert a value to a string
 * @param {*} v - Value to convert
 * @returns {string} - String representation
 */
function safeString(v) {
  if (v === null || v === undefined) {
    return "";
  }
  return String(v);
}

/**
 * Evaluate a single condition
 * @param {Object} condition - Condition object (e.g., { questionId: "q1", equals: 3 })
 * @param {Object} answers - User's answers object
 * @returns {boolean} - Whether condition is met
 */
function evaluateCondition(condition, answers) {
  if (!condition || typeof condition !== 'object') {
    return true; // No condition means always show
  }

  const questionId = condition.questionId || condition.question;
  if (!questionId) {
    return true; // No questionId means always show
  }

  const answerValue = answers[questionId];
  
  // Handle array answers (for checkbox questions)
  const answerArray = Array.isArray(answerValue) ? answerValue : [answerValue];
  const answerStr = safeString(answerValue).toLowerCase();
  const answerNum = safeNumber(answerValue);

  // Evaluate operators
  // equals
  if (condition.equals !== undefined) {
    const conditionValue = condition.equals;
    if (Array.isArray(answerValue)) {
      return answerArray.includes(String(conditionValue));
    }
    if (answerNum !== null && safeNumber(conditionValue) !== null) {
      return answerNum === safeNumber(conditionValue);
    }
    return answerStr === safeString(conditionValue).toLowerCase();
  }

  // not_equals
  if (condition.not_equals !== undefined) {
    const conditionValue = condition.not_equals;
    if (Array.isArray(answerValue)) {
      return !answerArray.includes(String(conditionValue));
    }
    if (answerNum !== null && safeNumber(conditionValue) !== null) {
      return answerNum !== safeNumber(conditionValue);
    }
    return answerStr !== safeString(conditionValue).toLowerCase();
  }

  // greater than or equal
  if (condition.gte !== undefined) {
    if (answerNum === null) return false;
    return answerNum >= safeNumber(condition.gte);
  }

  // less than or equal
  if (condition.lte !== undefined) {
    if (answerNum === null) return false;
    return answerNum <= safeNumber(condition.lte);
  }

  // greater than
  if (condition.gt !== undefined) {
    if (answerNum === null) return false;
    return answerNum > safeNumber(condition.gt);
  }

  // less than
  if (condition.lt !== undefined) {
    if (answerNum === null) return false;
    return answerNum < safeNumber(condition.lt);
  }

  // in (value is in array)
  if (condition.in !== undefined) {
    const allowedValues = Array.isArray(condition.in) ? condition.in : [condition.in];
    if (Array.isArray(answerValue)) {
      // For checkbox, check if any selected value is in allowed list
      return answerArray.some(val => allowedValues.includes(String(val)));
    }
    return allowedValues.includes(String(answerValue));
  }

  // contains (string contains substring)
  if (condition.contains !== undefined) {
    const searchStr = safeString(condition.contains).toLowerCase();
    if (Array.isArray(answerValue)) {
      return answerArray.some(val => safeString(val).toLowerCase().includes(searchStr));
    }
    return answerStr.includes(searchStr);
  }

  // Default: condition not met if no operator matches
  return false;
}

/**
 * Evaluate show_if condition (supports nested AND/OR)
 * @param {Object|Array} showIf - show_if condition object or array
 * @param {Object} answers - User's answers object
 * @returns {boolean} - Whether question should be shown
 */
function evaluateShowIf(showIf, answers) {
  // No condition means always show
  if (!showIf || showIf === null || showIf === undefined) {
    return true;
  }

  // If showIf is an array, treat as OR (any condition can be met)
  if (Array.isArray(showIf)) {
    return showIf.some(condition => evaluateShowIf(condition, answers));
  }

  // If showIf is an object
  if (typeof showIf === 'object') {
    // Handle AND operator
    if (showIf.and && Array.isArray(showIf.and)) {
      return showIf.and.every(condition => evaluateShowIf(condition, answers));
    }

    // Handle OR operator
    if (showIf.or && Array.isArray(showIf.or)) {
      return showIf.or.some(condition => evaluateShowIf(condition, answers));
    }

    // Handle NOT operator
    if (showIf.not !== undefined) {
      return !evaluateShowIf(showIf.not, answers);
    }

    // Simple condition (single questionId with operator)
    return evaluateCondition(showIf, answers);
  }

  // Default: show if condition is truthy
  return Boolean(showIf);
}

/**
 * Get all visible questions based on current answers
 * @param {Array} questions - Array of question objects
 * @param {Object} answers - User's answers object
 * @returns {Array} - Array of visible question objects
 */
function getVisibleQuestions(questions, answers) {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions.filter(question => {
    const showIf = question.show_if || question.showIf;
    return evaluateShowIf(showIf, answers);
  });
}

/**
 * Get question dependencies (which questions this question depends on)
 * @param {Object} question - Question object
 * @returns {Array<string>} - Array of question IDs this question depends on
 */
function getQuestionDependencies(question) {
  const dependencies = [];
  const showIf = question.show_if || question.showIf;

  if (!showIf) {
    return dependencies;
  }

  // Handle array of conditions
  if (Array.isArray(showIf)) {
    showIf.forEach(condition => {
      if (condition.questionId || condition.question) {
        dependencies.push(condition.questionId || condition.question);
      }
    });
  }

  // Handle object with AND/OR
  if (typeof showIf === 'object') {
    if (showIf.and && Array.isArray(showIf.and)) {
      showIf.and.forEach(condition => {
        if (condition.questionId || condition.question) {
          dependencies.push(condition.questionId || condition.question);
        }
      });
    }
    if (showIf.or && Array.isArray(showIf.or)) {
      showIf.or.forEach(condition => {
        if (condition.questionId || condition.question) {
          dependencies.push(condition.questionId || condition.question);
        }
      });
    }
    if (showIf.not && typeof showIf.not === 'object') {
      if (showIf.not.questionId || showIf.not.question) {
        dependencies.push(showIf.not.questionId || showIf.not.question);
      }
    }
    // Simple condition
    if (showIf.questionId || showIf.question) {
      dependencies.push(showIf.questionId || showIf.question);
    }
  }

  return [...new Set(dependencies)]; // Remove duplicates
}

/**
 * Build dependency graph for all questions
 * @param {Array} questions - Array of question objects
 * @returns {Object} - Dependency graph { questionId: [dependencies] }
 */
function buildDependencyGraph(questions) {
  const graph = {};

  questions.forEach(question => {
    const questionId = question.id;
    if (!questionId) return;

    graph[questionId] = getQuestionDependencies(question);
  });

  return graph;
}

/**
 * Detect circular dependencies in branching rules
 * Uses DFS to detect cycles
 * @param {Object} graph - Dependency graph
 * @returns {Object} - { hasCycle: boolean, cycles: Array<Array<string>> }
 */
function detectCircularDependencies(graph) {
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(node, path) {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      cycles.push(cycle);
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    recursionStack.add(node);

    const dependencies = graph[node] || [];
    dependencies.forEach(dep => {
      if (graph[dep]) {
        dfs(dep, [...path, node]);
      }
    });

    recursionStack.delete(node);
  }

  Object.keys(graph).forEach(node => {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  });

  return {
    hasCycle: cycles.length > 0,
    cycles
  };
}

module.exports = {
  evaluateShowIf,
  evaluateCondition,
  getVisibleQuestions,
  getQuestionDependencies,
  buildDependencyGraph,
  detectCircularDependencies
};

