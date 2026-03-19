import api from './api';

const promotionService = {
  // Validate a promotion code
  validatePromotion: async (code) => {
    const response = await api.get(`/promotions/validate/${code}`);
    return response.data;
  },

  // Apply promotion to order
  applyPromotion: async (code, orderAmount, serviceIds = []) => {
    const response = await api.post('/promotions/apply', {
      code,
      orderAmount,
      serviceIds,
    });
    return response.data;
  },
};

export default promotionService;
