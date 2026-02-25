const Barber = require('../models/Barber');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { deleteFile } = require('../middlewares/upload');

const getDefaultShop = async () => {
  let shop = await Shop.findOne();
  if (!shop) {
    shop = await Shop.create({
      name: 'Barberly Shop',
      address: '123 Main Street, City',
      phone: '0123456789'
    });
  }
  return shop;
};

const getAvailableBarbers = async (req, res, next) => {
  try {
    const barbers = await Barber.find({ isAvailable: true })
      .populate('user', 'name email phone avatar')
      .sort({ rating: -1 });

    sendResponse(res, 200, { barbers }, 'Available barbers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getAllBarbers = async (req, res, next) => {
  try {
    const barbers = await Barber.find()
      .populate('user', 'name email phone avatar isActive')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, { barbers }, 'All barbers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getBarberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id)
      .populate('user', 'name email phone avatar');

    if (!barber) {
      return next(new AppError('Barber not found', 404));
    }

    const reviews = await Review.find({ barber: id })
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    sendResponse(
      res,
      200,
      { barber, reviews },
      'Barber retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableBarbers
};
