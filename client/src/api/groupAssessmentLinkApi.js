import axiosInstance from '../utils/config/axiosInstance';

/**
 * Validate group assessment link token (public)
 */
export const validateGroupAssessmentLink = async (token) => {
  const response = await axiosInstance.get(`/public/group-assessment-links/${token}/validate`);
  return response.data;
};

/**
 * Create student profile (Student role only)
 * POST /api/public/group-assessment-links/:token/students
 */
export const createStudentProfile = async (token, studentData) => {
  const response = await axiosInstance.post(`/public/group-assessment-links/${token}/students`, studentData);
  return response.data;
};

/**
 * Get list of students for selection (Parent/Teacher roles)
 * GET /api/public/group-assessment-links/:token/students
 */
export const getStudents = async (token) => {
  const response = await axiosInstance.get(`/public/group-assessment-links/${token}/students`);
  return response.data;
};


