import axiosInstance from '../utils/config/axiosInstance';

/**
 * Validate group assessment link token (public)
 */
export const validateGroupAssessmentLink = async (token) => {
  const response = await axiosInstance.get(`/public/group-assessment-links/${token}/validate`);
  return response.data;
};


