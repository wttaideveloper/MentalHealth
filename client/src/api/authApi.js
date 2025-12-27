import axiosInstance from '../utils/config/axiosInstance';

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password (min 6 characters)
 * @param {string} firstName - User first name
 * @param {string} lastName - User last name
 * @returns {Promise} API response with userId
 */
export const signup = async (email, password, firstName, lastName) => {
  const response = await axiosInstance.post('/auth/signup', {
    email,
    password,
    firstName,
    lastName
  });
  return response.data;
};

/**
 * Verify user email with 6-digit code
 * @param {string} email - User email
 * @param {string} code - 6-digit verification code from email
 * @returns {Promise} API response
 */
export const verifyEmail = async (email, code) => {
  const response = await axiosInstance.post('/auth/verify-email', {
    email,
    code
  });
  return response.data;
};

/**
 * Resend verification code to user email
 * @param {string} email - User email
 * @returns {Promise} API response
 */
export const resendVerificationCode = async (email) => {
  const response = await axiosInstance.post('/auth/resend-verification-code', {
    email
  });
  return response.data;
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} deviceId - Optional device ID
 * @returns {Promise} API response with accessToken and refreshToken
 */
export const login = async (email, password, deviceId = '') => {
  const response = await axiosInstance.post('/auth/login', {
    email,
    password,
    deviceId
  });
  return response.data;
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise} API response with new accessToken and refreshToken
 */
export const refreshToken = async (refreshToken) => {
  const response = await axiosInstance.post('/auth/refresh', {
    refreshToken
  });
  return response.data;
};

/**
 * Logout user by revoking refresh token
 * @param {string} refreshToken - Refresh token to revoke
 * @returns {Promise} API response
 */
export const logout = async (refreshToken) => {
  const response = await axiosInstance.post('/auth/logout', {
    refreshToken
  });
  return response.data;
};

/**
 * Request password reset email
 * @param {string} email - User email
 * @returns {Promise} API response
 */
export const forgotPassword = async (email) => {
  const response = await axiosInstance.post('/auth/forgot-password', {
    email
  });
  return response.data;
};

/**
 * Reset password with token from email
 * @param {string} email - User email
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password (min 6 characters)
 * @returns {Promise} API response
 */
export const resetPassword = async (email, token, newPassword) => {
  const response = await axiosInstance.post('/auth/reset-password', {
    email,
    token,
    newPassword
  });
  return response.data;
};

/**
 * Get current user profile (requires authentication)
 * @returns {Promise} API response with user data
 */
export const getMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};

/**
 * Start Google OAuth flow (placeholder - not implemented yet)
 * @returns {Promise} API response
 */
export const googleLogin = async () => {
  const response = await axiosInstance.get('/auth/google/start');
  return response.data;
};

/**
 * Handle Google OAuth callback (placeholder - not implemented yet)
 * @returns {Promise} API response
 */
export const googleCallback = async () => {
  const response = await axiosInstance.get('/auth/google/callback');
  return response.data;
};

