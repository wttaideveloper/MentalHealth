/**
 * Utility functions for normalizing and fuzzy matching student names
 */

/**
 * Normalize a name: lowercase, trim, remove special characters, remove extra spaces
 * @param {string} name - The name to normalize
 * @returns {string} - Normalized name
 */
function normalizeName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Distance (0 = identical, higher = more different)
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings (0-100)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity percentage (0-100)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const normalized1 = normalizeName(str1);
  const normalized2 = normalizeName(str2);
  
  if (normalized1 === normalized2) return 100;
  
  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const similarity = ((maxLen - distance) / maxLen) * 100;
  
  return Math.max(0, Math.min(100, similarity));
}

/**
 * Find the best matching name from a list of names
 * @param {string} inputName - The name to match
 * @param {Array<string>} existingNames - Array of existing names
 * @param {number} threshold - Minimum similarity threshold (default: 85)
 * @returns {Object|null} - { name: string, similarity: number } or null if no match above threshold
 */
function findBestMatch(inputName, existingNames, threshold = 85) {
  if (!inputName || !existingNames || existingNames.length === 0) {
    return null;
  }
  
  const normalizedInput = normalizeName(inputName);
  let bestMatch = null;
  let bestSimilarity = 0;
  
  for (const existingName of existingNames) {
    const similarity = calculateSimilarity(normalizedInput, existingName);
    
    if (similarity >= threshold && similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = {
        name: existingName,
        similarity: Math.round(similarity)
      };
    }
  }
  
  return bestMatch;
}

/**
 * Filter names by similarity for auto-suggestions
 * @param {string} inputName - The name being typed
 * @param {Array<string>} existingNames - Array of existing names
 * @param {number} minSimilarity - Minimum similarity for suggestions (default: 50)
 * @param {number} maxResults - Maximum number of results (default: 5)
 * @returns {Array<Object>} - Array of { name: string, similarity: number } sorted by similarity
 */
function getSuggestions(inputName, existingNames, minSimilarity = 50, maxResults = 5) {
  if (!inputName || inputName.length < 2 || !existingNames || existingNames.length === 0) {
    return [];
  }
  
  const normalizedInput = normalizeName(inputName);
  const suggestions = [];
  
  for (const existingName of existingNames) {
    const similarity = calculateSimilarity(normalizedInput, existingName);
    
    if (similarity >= minSimilarity) {
      suggestions.push({
        name: existingName,
        similarity: Math.round(similarity)
      });
    }
  }
  
  // Sort by similarity (descending) and return top results
  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
}

module.exports = {
  normalizeName,
  calculateSimilarity,
  findBestMatch,
  getSuggestions,
  levenshteinDistance
};

