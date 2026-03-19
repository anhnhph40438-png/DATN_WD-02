import api from './api';

const userService = {
  // Get all users with pagination and filters
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user
  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // Toggle user status (active/inactive)
  toggleStatus: async (id) => {
    const response = await api.patch(`/users/${id}/status`);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Upload user avatar
  uploadAvatar: async (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default userService;
