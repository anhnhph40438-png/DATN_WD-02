import api from './api';

const shopService = {
  // Get shop information
  getShop: async () => {
    const response = await api.get('/shop');
    return response.data;
  },
};

export default shopService;
