const Barber = require('../models/Barber');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { deleteFile } = require('../middlewares/upload');


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

module.exports = {
  getAvailableBarbers
};
