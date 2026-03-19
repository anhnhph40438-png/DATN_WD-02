import api from './api';

const serviceService = {
  // Get all active services with optional filters
  getServices: async (params = {}) => {
    const response = await api.get('/services', { params });
    return response.data;
  },

  // Get service by ID
  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },
};

export default serviceService;
