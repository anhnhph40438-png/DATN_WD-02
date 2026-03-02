const Shop = require('../models/Shop');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { deleteFile } = require('../middlewares/upload');

const getOrCreateShop = async () => {
  let shop = await Shop.findOne();

  if (!shop) {
    shop = await Shop.create({
      name: 'Barberly Shop',
      address: '123 Main Street, City',
      phone: '0123456789',
      email: 'contact@barberly.com',
      description: 'Welcome to Barberly - Your premium barbershop experience'
    });
  }

  return shop;
};