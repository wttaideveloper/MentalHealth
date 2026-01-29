import axiosInstance from '../utils/config/axiosInstance';

// ============================================================================
// PUBLIC ASSESSMENT LINK APIs (No authentication required)
// ============================================================================

/**
 * Validate assessment link token
 * @param {string} token - Link token
 * @returns {Promise} API response with link and test info
 */
export const validateAssessmentLink = async (token) => {
  const response = await axiosInstance.get(`/public/assessment-links/${token}/validate`);
  return response.data;
};

/**
 * Create payment order for paid assessment link
 * @param {string} token - Link token
 * @param {string} participantEmail - Participant email
 * @param {string} participantName - Participant name (optional)
 * @returns {Promise} API response with payment order details
 */
export const createLinkPaymentOrder = async (token, participantEmail, participantName = '') => {
  const response = await axiosInstance.post(`/public/assessment-links/${token}/payment/order`, {
    participantEmail,
    participantName
  });
  return response.data;
};

/**
 * Verify payment for assessment link
 * @param {string} token - Link token
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} orderId - Razorpay order ID
 * @param {string} participantEmail - Participant email
 * @returns {Promise} API response with verification result
 */
export const verifyLinkPayment = async (token, paymentId, orderId, participantEmail) => {
  const response = await axiosInstance.post(`/public/assessment-links/${token}/payment/verify`, {
    paymentId,
    orderId,
    participantEmail
  });
  return response.data;
};

/**
 * Start anonymous assessment attempt via link
 * @param {string} token - Link token
 * @param {Object} participantInfo - Participant information (name, email, dateOfBirth, gender)
 * @param {string} perspective - Perspective for group assessment links (optional)
 * @returns {Promise} API response with attempt and test data
 */
export const startLinkAttempt = async (token, participantInfo = {}, perspective = null) => {
  const requestBody = {
    participantInfo
  };
  
  // Include perspective if provided (for group assessment links)
  if (perspective) {
    requestBody.perspective = perspective;
  }
  
  const response = await axiosInstance.post(`/public/assessment-links/${token}/start`, requestBody);
  return response.data;
};

/**
 * Save answers for anonymous attempt
 * @param {string} token - Link token
 * @param {string} attemptId - Attempt ID
 * @param {Object} answers - Answers object
 * @returns {Promise} API response with updated attempt data
 */
export const saveLinkAttempt = async (token, attemptId, answers) => {
  const response = await axiosInstance.post(`/public/assessment-links/${token}/save/${attemptId}`, {
    answers
  });
  return response.data;
};

/**
 * Submit anonymous attempt
 * @param {string} token - Link token
 * @param {string} attemptId - Attempt ID
 * @param {Object} answers - Optional answers object
 * @returns {Promise} API response with result data
 */
export const submitLinkAttempt = async (token, attemptId, answers = null) => {
  const body = answers ? { answers } : {};
  const response = await axiosInstance.post(`/public/assessment-links/${token}/submit/${attemptId}`, body);
  return response.data;
};

