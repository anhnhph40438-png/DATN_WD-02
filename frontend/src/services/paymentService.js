import api from './api';

const paymentService = {
  // Create payment for an appointment (VNPay)
  createPayment: async (appointmentId) => {
    const response = await api.post(`/payments/create/${appointmentId}`);
    return response.data;
  },

  // Get my transactions
  getMyTransactions: async (params = {}) => {
    const response = await api.get('/payments/my', { params });
    return response.data;
  },

  // Verify VNPay payment
  verifyPayment: async (queryParams) => {
    const response = await api.get('/payments/vnpay-return', { params: queryParams });
    return response.data;
  },
};

export default paymentService;
