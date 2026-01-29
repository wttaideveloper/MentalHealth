import axiosInstance from '../utils/config/axiosInstance';

// ============================================================================
// GROUP ASSESSMENT APIs
// ============================================================================

/**
 * Create a new group assessment
 * @param {Object} data - Group assessment data
 * @param {string} data.testId - Test ID
 * @param {string} data.groupName - Group name (e.g., "John Doe - Character Assessment")
 * @param {string} data.subjectId - Subject user ID (student)
 * @param {string} data.studentUserId - Student user ID
 * @param {string} data.parentUserId - Parent user ID
 * @param {string} data.teacherUserId - Teacher user ID
 * @param {string} data.notes - Optional notes
 * @returns {Promise} API response with created group assessment
 */
export const createGroupAssessment = async (data) => {
  const response = await axiosInstance.post('/group-assessments', data);
  return response.data;
};

/**
 * Get all group assessments for the current user
 * @param {Object} params - Query parameters (status, testId)
 * @returns {Promise} API response with group assessments list
 */
export const getGroupAssessments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  if (params.testId) queryParams.append('testId', params.testId);
  if (params.search) queryParams.append('search', params.search);
  
  const queryString = queryParams.toString();
  const url = `/group-assessments${queryString ? `?${queryString}` : ''}`;
  
  const response = await axiosInstance.get(url);
  return response.data;
};

/**
 * Get a single group assessment by ID
 * @param {string} groupId - Group assessment ID
 * @returns {Promise} API response with group assessment details
 */
export const getGroupAssessmentById = async (groupId) => {
  const response = await axiosInstance.get(`/group-assessments/${groupId}`);
  return response.data;
};

/**
 * Update a group assessment
 * @param {string} groupId - Group assessment ID
 * @param {Object} data - Update data (groupName, studentUserId, parentUserId, teacherUserId, notes)
 * @returns {Promise} API response with updated group assessment
 */
export const updateGroupAssessment = async (groupId, data) => {
  const response = await axiosInstance.put(`/group-assessments/${groupId}`, data);
  return response.data;
};

/**
 * Delete a group assessment
 * @param {string} groupId - Group assessment ID
 * @returns {Promise} API response
 */
export const deleteGroupAssessment = async (groupId) => {
  const response = await axiosInstance.delete(`/group-assessments/${groupId}`);
  return response.data;
};

/**
 * Get combined report data for a group assessment
 * @param {string} groupId - Group assessment ID
 * @returns {Promise} API response with combined report data
 */
export const getCombinedReport = async (groupId) => {
  const response = await axiosInstance.get(`/group-assessments/${groupId}/report`);
  return response.data;
};

/**
 * Download combined PDF report for a group assessment
 * @param {string} groupId - Group assessment ID
 * @returns {Promise} Blob response for PDF download
 */
export const downloadCombinedReport = async (groupId) => {
  const response = await axiosInstance.get(`/group-assessments/${groupId}/report/pdf`, {
    responseType: 'blob'
  });
  
  // Create blob URL and trigger download
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from Content-Disposition header if available
  const contentDisposition = response.headers['content-disposition'];
  let filename = `combined-report-${groupId}.pdf`;
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
 * Start an attempt for a group assessment
 * @param {string} testId - Test ID
 * @param {string} groupAssessmentId - Group assessment ID
 * @param {string} perspective - Perspective (student, parent, teacher)
 * @returns {Promise} API response with attempt data
 */
export const startGroupAttempt = async (testId, groupAssessmentId, perspective) => {
  const response = await axiosInstance.post(
    `/attempts/tests/${testId}/start?groupAssessmentId=${groupAssessmentId}&perspective=${perspective}`
  );
  return response.data;
};

/**
 * Merge two group assessments (admin only)
 * @param {string} sourceId - Source group assessment ID (will be deleted)
 * @param {string} targetId - Target group assessment ID (will be kept)
 * @returns {Promise} API response with merged group assessment
 */
export const mergeGroupAssessments = async (sourceId, targetId) => {
  const response = await axiosInstance.post(`/group-assessments/${sourceId}/merge/${targetId}`);
  return response.data;
};

