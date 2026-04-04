import api from './api';

const statisticsService = {
  // Get dashboard stats for admin
  getDashboardStats: async () => {
    const response = await api.get('/statistics/dashboard');
    return response.data;
  },

  // Get revenue statistics
  getRevenueStats: async (params = {}) => {
    const response = await api.get('/statistics/revenue', { params });
    return response.data;
  },

  // Get appointment statistics
  getAppointmentStats: async (params = {}) => {
    const response = await api.get('/statistics/appointments', { params });
    return response.data;
  },

  // Get customer statistics
  getCustomerStats: async (params = {}) => {
    const response = await api.get('/statistics/customers', { params });
    return response.data;
  },

  // Get service statistics (for admin)
  getServiceStats: async (params = {}) => {
    const response = await api.get('/statistics/services', { params });
    return response.data;
  },

  // Get barber statistics (for admin)
  getBarberStats: async (params = {}) => {
    const response = await api.get('/statistics/barbers', { params });
    return response.data;
  },

  // Get statistics for a specific barber
  getBarberStatistics: async (barberId, params = {}) => {
    const response = await api.get(`/statistics/barber/${barberId}`, { params });
    return response.data;
  },
};

export default statisticsService;
