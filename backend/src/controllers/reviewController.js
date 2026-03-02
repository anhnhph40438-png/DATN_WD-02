const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Barber = require('../models/Barber');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const createReview = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    const customerId = req.user._id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.customer.toString() !== customerId.toString()) {
      return next(new AppError('You can only review your own appointments', 403));
    }

    if (appointment.status !== 'completed') {
      return next(new AppError('You can only review completed appointments', 400));
    }

    const existingReview = await Review.findOne({ appointment: appointmentId });
    if (existingReview) {
      return next(new AppError('You have already reviewed this appointment', 400));
    }

    const review = await Review.create({
      customer: customerId,
      barber: appointment.barber,
      appointment: appointmentId,
      rating,
      comment
    });

    await review.populate([
      { path: 'customer', select: 'name avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name avatar' } },
      { path: 'appointment', select: 'date services' }
    ]);

    sendResponse(res, 201, { review }, 'Review created successfully');
  } catch (error) {
    next(error);
  }
};


const getReviews = async (req, res, next) => {
  try {
    const { barberId, rating, sort = 'newest', page = 1, limit = 10 } = req.query;

    let query = {};

    if (barberId) {
      query.barber = barberId;
    }

    if (rating) {
      query.rating = parseInt(rating, 10);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const reviews = await Review.find(query)
      .populate('customer', 'name avatar')
      .populate({
        path: 'barber',
        populate: { path: 'user', select: 'name avatar' }
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments(query);

    sendResponse(
      res,
      200,
      {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      'Reviews retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const customerId = req.user._id;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({ customer: customerId })
      .populate({
        path: 'barber',
        populate: { path: 'user', select: 'name avatar' }
      })
      .populate('appointment', 'date services')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments({ customer: customerId });

    sendResponse(
      res,
      200,
      {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      'My reviews retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};


const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('customer', 'name avatar')
      .populate({
        path: 'barber',
        populate: { path: 'user', select: 'name avatar' }
      })
      .populate('appointment', 'date services');

    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    sendResponse(res, 200, { review }, 'Review retrieved successfully');
  } catch (error) {
    next(error);
  }
};