import axiosInstance from "../utils/config/axiosInstance";

export const apiHealthCheck = () => {
  return axiosInstance.get('/health');
};