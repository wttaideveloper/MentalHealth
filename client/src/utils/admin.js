import { getMe } from '../api/authApi';

/**
 * Check if current user is admin
 * @returns {Promise<boolean>} True if user is admin
 */
export const isAdmin = async () => {
  try {
    const response = await getMe();
    return response.data?.role === 'admin';
  } catch (error) {
    return false;
  }
};

/**
 * Get user role from API
 * @returns {Promise<string|null>} User role or null
 */
export const getUserRole = async () => {
  try {
    const response = await getMe();
    return response.data?.role || null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if user is authenticated and is admin
 * @returns {Promise<{isAuthenticated: boolean, isAdmin: boolean}>}
 */
export const checkAdminAuth = async () => {
  try {
    const response = await getMe();
    return {
      isAuthenticated: true,
      isAdmin: response.data?.role === 'admin',
      user: response.data
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      user: null
    };
  }
};

