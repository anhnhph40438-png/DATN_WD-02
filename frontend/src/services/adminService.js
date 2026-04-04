import api from './api';

const adminService = {
  // ============ Dashboard ============
  getDashboardStats: async () => {
    const response = await api.get('/statistics/dashboard');
    return response.data;
  },

  // ============ Users Management ============
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  toggleUserStatus: async (id) => {
    const response = await api.patch(`/users/${id}/status`);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // ============ Barbers Management ============
  getAllBarbers: async (params = {}) => {
    const response = await api.get('/barbers/all', { params });
    return response.data;
  },

  createBarber: async (data) => {
    const response = await api.post('/barbers', data);
    return response.data;
  },

  updateBarber: async (id, data) => {
    const response = await api.put(`/barbers/${id}`, data);
    return response.data;
  },

  toggleBarberStatus: async (id) => {
    const response = await api.patch(`/barbers/${id}/status`);
    return response.data;
  },

  deleteBarber: async (id) => {
    const response = await api.delete(`/barbers/${id}`);
    return response.data;
  },

  // ============ Services Management ============
  getAllServices: async (params = {}) => {
    const response = await api.get('/services/all', { params });
    return response.data;
  },

  createService: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    const response = await api.post('/services', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateService: async (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    const response = await api.put(`/services/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  toggleServiceStatus: async (id) => {
    const response = await api.patch(`/services/${id}/status`);
    return response.data;
  },

  deleteService: async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  // ============ Appointments Management ============
  getAllAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  cancelAppointment: async (id, reason = '') => {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  confirmAppointment: async (id) => {
    const response = await api.patch(`/appointments/${id}/confirm`);
    return response.data;
  },

  rejectAppointment: async (id, reason = '') => {
    const response = await api.patch(`/appointments/${id}/reject`, { reason });
    return response.data;
  },

  startAppointment: async (id) => {
    const response = await api.patch(`/appointments/${id}/start`);
    return response.data;
  },

  completeAppointment: async (id) => {
    const response = await api.patch(`/appointments/${id}/complete`);
    return response.data;
  },

  // ============ Promotions Management ============
  getAllPromotions: async (params = {}) => {
    const response = await api.get('/promotions', { params });
    return response.data;
  },

  getPromotionById: async (id) => {
    const response = await api.get(`/promotions/${id}`);
    return response.data;
  },

  createPromotion: async (data) => {
    const response = await api.post('/promotions', data);
    return response.data;
  },

  updatePromotion: async (id, data) => {
    const response = await api.put(`/promotions/${id}`, data);
    return response.data;
  },

  deletePromotion: async (id) => {
    const response = await api.delete(`/promotions/${id}`);
    return response.data;
  },

  togglePromotionStatus: async (id) => {
    const response = await api.patch(`/promotions/${id}/status`);
    return response.data;
  },

  // ============ Transactions Management ============
  getAllTransactions: async (params = {}) => {
    const response = await api.get('/payments/transactions', { params });
    return response.data;
  },

  getTransactionById: async (id) => {
    const response = await api.get(`/payments/transactions/${id}`);
    return response.data;
  },

  processRefund: async (id, reason) => {
    const response = await api.post(`/payments/${id}/refund`, { reason });
    return response.data;
  },

  // ============ Shop Management ============
  getShopInfo: async () => {
    const response = await api.get('/shop');
    return response.data;
  },

  updateShopInfo: async (data) => {
    const response = await api.put('/shop', data);
    return response.data;
  },

  updateShopHours: async (hours) => {
    const response = await api.patch('/shop/hours', { openingHours: hours });
    return response.data;
  },

  uploadShopImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    const response = await api.post('/shop/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteShopImage: async (index) => {
    const response = await api.delete(`/shop/images/${index}`);
    return response.data;
  },

  // ============ Reviews Management ============
  getAllReviews: async (params = {}) => {
    const response = await api.get('/reviews', { params });
    return response.data;
  },

  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },
};

export default adminService;
