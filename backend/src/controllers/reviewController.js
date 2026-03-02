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
