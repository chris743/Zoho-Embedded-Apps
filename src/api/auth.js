/**
 * Authentication API service for username/password login
 */
export const AuthApi = (apiClient) => ({
    /**
     * Login with username and password
     * @param {Object} credentials - { username, password }
     * @returns {Promise} API response with token and user info
     */
    login: async (credentials) => {
        const response = await apiClient.post('/auth/login', credentials);
        return response;
    },

    /**
     * Logout and invalidate token
     * @returns {Promise} API response
     */
    logout: async () => {
        const response = await apiClient.post('/auth/logout');
        return response;
    },

    /**
     * Verify current token validity
     * @returns {Promise} API response with user info
     */
    verify: async () => {
        const response = await apiClient.get('/auth/verify');
        return response;
    },

    /**
     * Refresh authentication token
     * @returns {Promise} API response with new token
     */
    refresh: async () => {
        const response = await apiClient.post('/auth/refresh');
        return response;
    }
});

/**
 * User Management API service (for existing users to manage other users)
 */
export const UsersApi = (apiClient) => ({
    /**
     * List all users
     * @param {Object} params - Query parameters
     * @returns {Promise} API response with users array
     */
    list: async (params = {}) => {
        const response = await apiClient.get('/users', { params });
        return response;
    },

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise} API response with created user
     */
    create: async (userData) => {
        const response = await apiClient.post('/users', userData);
        return response;
    },

    /**
     * Update user
     * @param {string|number} id - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise} API response with updated user
     */
    update: async (id, userData) => {
        const response = await apiClient.put(`/users/${id}`, userData);
        return response;
    },

    /**
     * Delete user
     * @param {string|number} id - User ID
     * @returns {Promise} API response
     */
    remove: async (id) => {
        const response = await apiClient.delete(`/users/${id}`);
        return response;
    },

    /**
     * Reset user password
     * @param {string|number} id - User ID
     * @param {Object} passwordData - { newPassword }
     * @returns {Promise} API response
     */
    resetPassword: async (id, passwordData) => {
        const response = await apiClient.post(`/users/${id}/reset-password`, passwordData);
        return response;
    },

    /**
     * Change current user's password
     * @param {Object} passwordData - { currentPassword, newPassword }
     * @returns {Promise} API response
     */
    changePassword: async (passwordData) => {
        const response = await apiClient.post('/users/change-password', passwordData);
        return response;
    }
});