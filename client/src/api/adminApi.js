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

