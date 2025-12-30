import axiosInstance from '../utils/config/axiosInstance';

// ============================================================================
// TEST APIs
// ============================================================================

/**
 * Get all assessments/tests
 * @param {Object} params - Query parameters (q, category, free, popularity)
 * @returns {Promise} API response with tests list
 */
export const getAllAssessments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.q) queryParams.append('q', params.q);
  if (params.category) queryParams.append('category', params.category);
  if (params.free !== undefined) queryParams.append('free', params.free);
  if (params.popularity !== undefined) queryParams.append('popularity', params.popularity);
  
  const queryString = queryParams.toString();
  const url = `/tests${queryString ? `?${queryString}` : ''}`;
  
  const response = await axiosInstance.get(url);
  return response.data;
};

/**
 * Get assessment/test by ID
 * @param {string} testId - Test ID
 * @returns {Promise} API response with test details
 */
export const getAssessmentById = async (testId) => {
  const response = await axiosInstance.get(`/tests/${testId}`);
  return response.data;
};

// ============================================================================
// ATTEMPT APIs
// ============================================================================

/**
 * Get all ongoing attempts for the current user
 * @returns {Promise} API response with ongoing attempts list
 */
export const getOngoingAttempts = async () => {
  const response = await axiosInstance.get('/attempts/ongoing');
  return response.data;
};

/**
 * Start a new test attempt
 * @param {string} testId - Test ID
 * @returns {Promise} API response with attempt data and test schema
 */
export const startAttempt = async (testId) => {
  const response = await axiosInstance.post(`/attempts/tests/${testId}/start`);
  return response.data;
};

/**
 * Save/autosave attempt answers
 * @param {string} attemptId - Attempt ID
 * @param {Object} answers - Answers object (questionId: answer pairs)
 * @returns {Promise} API response with updated attempt data
 */
export const saveAttempt = async (attemptId, answers) => {
  const response = await axiosInstance.post(`/attempts/${attemptId}/save`, {
    answers
  });
  return response.data;
};

/**
 * Submit attempt (final submission)
 * @param {string} attemptId - Attempt ID
 * @param {Object} answers - Optional answers object (if provided, will use these instead of saved answers)
 * @returns {Promise} API response with result data
 */
export const submitAttempt = async (attemptId, answers = null) => {
  const body = answers ? { answers } : {};
  const response = await axiosInstance.post(`/attempts/${attemptId}/submit`, body);
  return response.data;
};

// ============================================================================
// RESULT APIs
// ============================================================================

/**
 * Get all results for the current user
 * @param {Object} params - Query parameters (testId, limit, skip)
 * @returns {Promise} API response with results list
 */
export const getMyResults = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.testId) queryParams.append('testId', params.testId);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.skip) queryParams.append('skip', params.skip);
  
  const queryString = queryParams.toString();
  const url = `/results${queryString ? `?${queryString}` : ''}`;
  
  const response = await axiosInstance.get(url);
  return response.data;
};

/**
 * Get result by ID
 * @param {string} resultId - Result ID
 * @returns {Promise} API response with result details
 */
export const getResultById = async (resultId) => {
  const response = await axiosInstance.get(`/results/${resultId}`);
  return response.data;
};

/**
 * Get result trends for the current user
 * @param {Object} params - Query parameters (testId)
 * @returns {Promise} API response with trends data
 */
export const getResultTrends = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.testId) queryParams.append('testId', params.testId);
  
  const queryString = queryParams.toString();
  const url = `/results/trends${queryString ? `?${queryString}` : ''}`;
  
  const response = await axiosInstance.get(url);
  return response.data;
};

// ============================================================================
// REPORT APIs
// ============================================================================

/**
 * Get report data (JSON format)
 * @param {string} resultId - Result ID
 * @returns {Promise} API response with report data
 */
export const getReportData = async (resultId) => {
  const response = await axiosInstance.get(`/reports/${resultId}/data`);
  return response.data;
};

/**
 * Download PDF report
 * Note: This returns a blob/file stream, handle accordingly
 * @param {string} resultId - Result ID
 * @returns {Promise} Blob response for PDF download
 */
export const downloadReport = async (resultId) => {
  const response = await axiosInstance.get(`/reports/${resultId}/download`, {
    responseType: 'blob' // Important: set responseType to 'blob' for binary data
  });
  
  // Create a blob URL and trigger download
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers['content-disposition'];
  let filename = `assessment-report-${resultId}.pdf`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return { success: true, filename };
};

/**
 * Download PDF report (alternative method - returns blob for custom handling)
 * @param {string} resultId - Result ID
 * @returns {Promise} Blob response
 */
export const downloadReportAsBlob = async (resultId) => {
  const response = await axiosInstance.get(`/reports/${resultId}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

