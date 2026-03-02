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

const getShop = async (req, res, next) => {
  try {
    const shop = await getOrCreateShop();

    sendResponse(res, 200, { shop }, 'Shop info retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateOpeningHours = async (req, res, next) => {
  try {
    const { openingHours } = req.body;

    if (!openingHours || typeof openingHours !== 'object') {
      return next(new AppError('Opening hours object is required', 400));
    }

    let shop = await getOrCreateShop();

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of validDays) {
      if (openingHours[day]) {
        const daySchedule = openingHours[day];

        if (daySchedule.open !== undefined) {
          shop.openingHours[day].open = daySchedule.open;
        }
        if (daySchedule.close !== undefined) {
          shop.openingHours[day].close = daySchedule.close;
        }
        if (daySchedule.isClosed !== undefined) {
          shop.openingHours[day].isClosed = daySchedule.isClosed;
        }
      }
    }

    await shop.save();

    sendResponse(res, 200, { openingHours: shop.openingHours }, 'Opening hours updated successfully');
  } catch (error) {
    next(error);
  }
};