import axiosInstance from '../utils/config/axiosInstance';

/**
 * Admin login
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @param {string} deviceId - Optional device ID
 * @returns {Promise} API response with accessToken and refreshToken
 */
export const adminLogin = async (email, password, deviceId = '') => {
  const response = await axiosInstance.post('/admin/login', {
    email,
    password,
    deviceId
  });
  return response.data;
};

/**
 * Get admin dashboard summary statistics
 * @returns {Promise} API response with summary data
 */
export const getAdminSummary = async () => {
  const response = await axiosInstance.get('/admin/reports/summary');
  return response.data;
};

/**
 * Download purchases as CSV
 * @returns {Promise} Blob response for CSV download
 */
export const downloadPurchasesCsv = async () => {
  const response = await axiosInstance.get('/admin/reports/purchases/csv', {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Download usage/test attempts as CSV
 * @returns {Promise} Blob response for CSV download
 */
export const downloadUsageCsv = async () => {
  const response = await axiosInstance.get('/admin/reports/usage/csv', {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Get purchases data for viewing (admin only)
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise} API response with purchases data
 */
export const getPurchasesData = async (params = {}) => {
  const response = await axiosInstance.get('/admin/reports/purchases', { params });
  return response.data;
};

/**
 * Get usage/test attempts data for viewing (admin only)
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise} API response with usage data
 */
export const getUsageData = async (params = {}) => {
  const response = await axiosInstance.get('/admin/reports/usage', { params });
  return response.data;
};

// ============================================================================
// ASSESSMENT LINK APIs (Admin only)
// ============================================================================

/**
 * Get all assessment links (admin only)
 * @param {Object} params - Query parameters (page, limit, isActive)
 * @returns {Promise} API response with links list
 */
export const getAssessmentLinks = async (params = {}) => {
  const response = await axiosInstance.get('/admin/assessment-links', { params });
  return response.data;
};

/**
 * Create new assessment link (admin only)
 * @param {Object} data - Link data (testId, campaignName, expiresAt, maxAttempts)
 * @returns {Promise} API response with created link
 */
export const createAssessmentLink = async (data) => {
  const response = await axiosInstance.post('/admin/assessment-links', data);
  return response.data;
};

/**
 * Get results for a specific assessment link (admin only)
 * @param {string} linkId - Assessment link ID
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise} API response with results list
 */
export const getLinkResults = async (linkId, params = {}) => {
  const response = await axiosInstance.get(`/admin/assessment-links/${linkId}/results`, { params });
  return response.data;
};

/**
 * Send assessment link via email (admin only)
 * @param {string} linkId - Assessment link ID
 * @param {string|string[]} recipientEmails - Single email or array of emails
 * @param {string} customMessage - Optional custom message
 * @returns {Promise} API response with sending results
 */
export const sendAssessmentLinkEmail = async (linkId, recipientEmails, customMessage = '') => {
  // Set longer timeout for bulk email sending (60 seconds)
  // Bulk email operations can take time depending on number of recipients
  const response = await axiosInstance.post(`/admin/assessment-links/${linkId}/send-email`, {
    recipientEmails,
    customMessage
  }, {
    timeout: 60000 // 60 seconds timeout for email sending
  });
  return response.data;
};

/**
 * Get email history for a specific assessment link (admin only)
 * @param {string} linkId - Assessment link ID
 * @param {Object} params - Query parameters (page, limit, status)
 * @returns {Promise} API response with email history
 */
export const getLinkEmailHistory = async (linkId, params = {}) => {
  const response = await axiosInstance.get(`/admin/assessment-links/${linkId}/email-history`, { params });
  return response.data;
};

// ============================================================================
// GROUP ASSESSMENT LINKS APIs
// ============================================================================

/**
 * Get all group assessment links (admin only)
 * @param {Object} params - Query parameters (isActive, testId)
 * @returns {Promise} API response with group assessment links list
 */
export const getGroupAssessmentLinks = async (params = {}) => {
  const response = await axiosInstance.get('/admin/group-assessment-links', { params });
  return response.data;
};

/**
 * Create group assessment link (admin only)
 * @param {Object} data - Group assessment link data
 * @returns {Promise} API response with created link
 */
export const createGroupAssessmentLink = async (data) => {
  const response = await axiosInstance.post('/admin/group-assessment-links', data);
  return response.data;
};

/**
 * Get group assessment link by ID (admin only)
 * @param {string} linkId - Link ID
 * @returns {Promise} API response with link data
 */
export const getGroupAssessmentLinkById = async (linkId) => {
  const response = await axiosInstance.get(`/admin/group-assessment-links/${linkId}`);
  return response.data;
};

/**
 * Update group assessment link (admin only)
 * @param {string} linkId - Link ID
 * @param {Object} data - Updated link data
 * @returns {Promise} API response
 */
export const updateGroupAssessmentLink = async (linkId, data) => {
  const response = await axiosInstance.put(`/admin/group-assessment-links/${linkId}`, data);
  return response.data;
};

/**
 * Get results for a specific group assessment link (admin only)
 * @param {string} linkId - Group assessment link ID
 * @param {Object} params - Query parameters (page, limit, search)
 * @returns {Promise} API response with results list
 */
export const getGroupLinkResults = async (linkId, params = {}) => {
  const response = await axiosInstance.get(`/admin/group-assessment-links/${linkId}/results`, { params });
  return response.data;
};

/**
 * Get detailed information for a specific group assessment (admin only)
 * @param {string} linkId - Group assessment link ID
 * @param {string} groupId - Group assessment ID
 * @returns {Promise} API response with group assessment details
 */
export const getGroupAssessmentDetails = async (linkId, groupId) => {
  const response = await axiosInstance.get(`/admin/group-assessment-links/${linkId}/group-assessments/${groupId}`);
  return response.data;
};

/**
 * Download PDF for a group assessment (admin only)
 * @param {string} linkId - Group assessment link ID
 * @param {string} groupId - Group assessment ID
 * @returns {Promise} Blob response for PDF download
 */
export const downloadGroupAssessmentPDF = async (linkId, groupId) => {
  const response = await axiosInstance.get(`/admin/group-assessment-links/${linkId}/group-assessments/${groupId}/pdf`, {
    responseType: 'blob'
  });
  
  // Create blob URL and trigger download
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from Content-Disposition header if available
  const contentDisposition = response.headers['content-disposition'];
  let filename = `group-assessment-${groupId}.pdf`;
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
  
  return { success: true, message: 'Report downloaded successfully' };
};

/**
 * Delete group assessment link (admin only)
 * @param {string} linkId - Link ID
 * @returns {Promise} API response
 */
export const deleteGroupAssessmentLink = async (linkId) => {
  const response = await axiosInstance.delete(`/admin/group-assessment-links/${linkId}`);
  return response.data;
};

/**
 * Get all email history across all assessment links (admin only)
 * @param {Object} params - Query parameters (page, limit, status, linkId)
 * @returns {Promise} API response with email history
 */
export const getAllEmailHistory = async (params = {}) => {
  const response = await axiosInstance.get('/admin/assessment-links/email-history/all', { params });
  return response.data;
};

/**
 * Get all users (admin only)
 * @param {Object} params - Query parameters (page, limit, search, role)
 * @returns {Promise} API response with users list
 */
export const getUsers = async (params = {}) => {
  const response = await axiosInstance.get('/admin/users', { params });
  return response.data;
};

/**
 * Get user by ID (admin only)
 * @param {string} userId - User ID
 * @returns {Promise} API response with user data
 */
export const getUserById = async (userId) => {
  const response = await axiosInstance.get(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Update user (admin only)
 * @param {string} userId - User ID
 * @param {Object} data - User data to update
 * @returns {Promise} API response
 */
export const updateUser = async (userId, data) => {
  const response = await axiosInstance.put(`/admin/users/${userId}`, data);
  return response.data;
};

/**
 * Get all tests including inactive (admin only)
 * @param {Object} params - Query parameters (page, limit, search, isActive)
 * @returns {Promise} API response with tests list
 */
export const getAdminTests = async (params = {}) => {
  const response = await axiosInstance.get('/admin/tests', { params });
  return response.data;
};

/**
 * Get test by ID (admin only)
 * @param {string} testId - Test ID
 * @returns {Promise} API response with test data
 */
export const getAdminTestById = async (testId) => {
  const response = await axiosInstance.get(`/admin/tests/${testId}`);
  return response.data;
};

/**
 * Create new test (admin only)
 * @param {Object} testData - Test data
 * @returns {Promise} API response
 */
export const createTest = async (testData) => {
  const response = await axiosInstance.post('/admin/tests', testData);
  return response.data;
};

/**
 * Update test (admin only)
 * @param {string} testId - Test ID
 * @param {Object} testData - Test data to update
 * @returns {Promise} API response
 */
export const updateTest = async (testId, testData) => {
  const response = await axiosInstance.put(`/admin/tests/${testId}`, testData);
  return response.data;
};

/**
 * Delete test (admin only - soft delete)
 * @param {string} testId - Test ID
 * @returns {Promise} API response
 */
export const deleteTest = async (testId) => {
  const response = await axiosInstance.delete(`/admin/tests/${testId}`);
  return response.data;
};

/**
 * Get all assessment results (admin only - read-only)
 * @param {Object} params - Query parameters (page, limit, search, testId)
 * @returns {Promise} API response with results list
 */
export const getAdminResults = async (params = {}) => {
  const response = await axiosInstance.get('/admin/results', { params });
  return response.data;
};

/**
 * Get result by ID (admin only - read-only)
 * @param {string} resultId - Result ID
 * @returns {Promise} API response with result data
 */
export const getAdminResultById = async (resultId) => {
  const response = await axiosInstance.get(`/admin/results/${resultId}`);
  return response.data;
};

