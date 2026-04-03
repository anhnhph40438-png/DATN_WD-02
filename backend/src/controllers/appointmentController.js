const Appointment = require('../models/Appointment');
const Barber = require('../models/Barber');
const Review = require('../models/Review');
const Service = require('../models/Service');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { sendAppointmentConfirmation } = require('../services/emailService');

const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const addMinutesToTime = (time, minutes) => {
  const totalMinutes = timeToMinutes(time) + minutes;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const isOverlapping = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

const getDefaultShop = async () => {
  const shop = await Shop.findOne();
  if (!shop) {
    throw new AppError('No shop found in the system', 404);
  }
  return shop;
};

const createAppointment = async (req, res, next) => {
  try {
    const { barberId, serviceIds, date, startTime, notes, promoCode } = req.body;
    const customerId = req.user._id;

    const barber = await Barber.findById(barberId).populate('user', 'name');
    if (!barber) {
      return next(new AppError('Barber not found', 404));
    }
    if (!barber.isAvailable) {
      return next(new AppError('Barber is currently not available', 400));
    }

    const services = await Service.find({
      _id: { $in: serviceIds },
      isActive: true
    });

    if (services.length !== serviceIds.length) {
      return next(new AppError('One or more services are invalid or inactive', 400));
    }

    // Giới hạn: mỗi lần đặt chỉ được chọn tối đa 1 combo
    const comboCount = services.filter(s => s.category === 'combo').length;
    if (comboCount > 1) {
      return next(new AppError('Mỗi lần đặt lịch chỉ được chọn tối đa 1 combo', 400));
    }

    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);

    const endTime = addMinutesToTime(startTime, totalDuration);

    const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

    const appointmentDate = new Date(date);

    // Validate: không cho đặt lịch ngày quá khứ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return next(new AppError('Cannot book an appointment in the past', 400));
    }

    const dayName = getDayName(appointmentDate);
    const workingDay = barber.workingHours[dayName];

    if (workingDay.isOff) {
      return next(new AppError(`Barber is not working on ${dayName}`, 400));
    }

    const workStart = timeToMinutes(workingDay.start);
    const workEnd = timeToMinutes(workingDay.end);
    const appointmentStart = timeToMinutes(startTime);
    const appointmentEnd = timeToMinutes(endTime);

    if (appointmentStart < workStart || appointmentEnd > workEnd) {
      return next(
        new AppError(
          `Appointment must be within barber's working hours (${workingDay.start} - ${workingDay.end})`,
          400
        )
      );
    }

    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      barber: barberId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    });

    for (const existing of existingAppointments) {
      if (isOverlapping(startTime, endTime, existing.startTime, existing.endTime)) {
        return next(
          new AppError(
            `Time slot conflicts with an existing appointment (${existing.startTime} - ${existing.endTime})`,
            400
          )
        );
      }
    }

    const shop = await getDefaultShop();

    // Xử lý mã khuyến mãi
    let discount = 0;
    let finalPrice = totalPrice;
    let appliedPromoCode = undefined;

    if (promoCode) {
      const promotion = await Promotion.findOne({ code: promoCode.toUpperCase() });
      if (promotion) {
        const validity = promotion.isValid();
        if (validity.valid) {
          const discountResult = promotion.calculateDiscount(totalPrice);
          discount = discountResult.discount;
          finalPrice = discountResult.finalAmount;
          appliedPromoCode = promoCode.toUpperCase();

          // Tăng số lần sử dụng
          promotion.usedCount += 1;
          await promotion.save();
        }
      }
    }

    const appointment = await Appointment.create({
      customer: customerId,
      barber: barberId,
      shop: shop._id,
      services: serviceIds,
      date: appointmentDate,
      startTime,
      endTime,
      totalPrice,
      totalDuration,
      notes,
      promoCode: appliedPromoCode,
      discount,
      finalPrice,
      status: 'pending'
    });

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    try {
      const emailData = {
        user: appointment.customer,
        shop: appointment.shop,
        service: { name: appointment.services.map(s => s.name).join(', ') },
        barber: { name: appointment.barber.user.name },
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        totalPrice: appointment.totalPrice
      };
      await sendAppointmentConfirmation(emailData);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError.message);
    }

    sendResponse(res, 201, { appointment }, 'Appointment created successfully');
  } catch (error) {
    next(error);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const { status, date, startDate, endDate, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const userId = req.user._id;

    let query = {};

    if (userRole === 'customer') {
      query.customer = userId;
    }
    // admin and barber can see all appointments

    if (status) {
      query.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.date = { $gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $lte: end };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const appointments = await Appointment.find(query)
      .populate('customer', 'name email phone avatar')
      .populate({
        path: 'barber',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .populate('shop', 'name address phone')
      .populate('services', 'name price duration')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Appointment.countDocuments(query);

    // Add hasReview flag for completed appointments
    const appointmentIds = appointments
      .filter(a => a.status === 'completed')
      .map(a => a._id);

    const existingReviews = appointmentIds.length > 0
      ? await Review.find({ appointment: { $in: appointmentIds } }).select('appointment')
      : [];

    const reviewedAppointmentIds = new Set(
      existingReviews.map(r => r.appointment.toString())
    );

    const appointmentsWithReview = appointments.map(apt => {
      const aptObj = apt.toObject();
      aptObj.hasReview = reviewedAppointmentIds.has(apt._id.toString());
      return aptObj;
    });

    sendResponse(
      res,
      200,
      {
        appointments: appointmentsWithReview,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      'Appointments retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('customer', 'name email phone avatar')
      .populate({
        path: 'barber',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .populate('shop', 'name address phone')
      .populate('services', 'name price duration');

    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    const userRole = req.user.role;
    const userId = req.user._id;

    if (userRole === 'customer') {
      if (appointment.customer._id.toString() !== userId.toString()) {
        return next(new AppError('You do not have permission to view this appointment', 403));
      }
    }
    // admin and barber can view any appointment

    sendResponse(res, 200, { appointment }, 'Appointment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const confirmAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.status !== 'pending') {
      return next(
        new AppError(`Cannot confirm appointment with status '${appointment.status}'`, 400)
      );
    }

    appointment.status = 'confirmed';
    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    sendResponse(res, 200, { appointment }, 'Appointment confirmed successfully');
  } catch (error) {
    next(error);
  }
};

const rejectAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.status !== 'pending') {
      return next(
        new AppError(`Cannot reject appointment with status '${appointment.status}'`, 400)
      );
    }

    // Prevent barber from rejecting paid appointments
    if (appointment.paymentStatus === 'paid') {
      return next(
        new AppError('Cannot reject an appointment that has already been paid. Please contact admin for refund.', 400)
      );
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = reason || 'Rejected by admin';
    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    sendResponse(res, 200, { appointment }, 'Appointment rejected successfully');
  } catch (error) {
    next(error);
  }
};

const startAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.status !== 'confirmed') {
      return next(
        new AppError(`Cannot start appointment with status '${appointment.status}'`, 400)
      );
    }

    appointment.status = 'in-progress';
    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    sendResponse(res, 200, { appointment }, 'Appointment started successfully');
  } catch (error) {
    next(error);
  }
};

const completeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.status !== 'in-progress') {
      return next(
        new AppError(`Cannot complete appointment with status '${appointment.status}'`, 400)
      );
    }

    appointment.status = 'completed';
    appointment.paymentStatus = 'paid';
    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    sendResponse(res, 200, { appointment }, 'Appointment completed successfully');
  } catch (error) {
    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    const userRole = req.user.role;
    const userId = req.user._id;

    if (userRole === 'customer') {
      if (appointment.customer.toString() !== userId.toString()) {
        return next(new AppError('You do not have permission to cancel this appointment', 403));
      }
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return next(
        new AppError(`Cannot cancel appointment with status '${appointment.status}'`, 400)
      );
    }

    // Prevent barber from cancelling paid appointments
    if (userRole === 'barber' && appointment.paymentStatus === 'paid') {
      return next(
        new AppError('Cannot cancel an appointment that has already been paid. Please contact admin for refund.', 400)
      );
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = reason || 'Cancelled by customer';
    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    sendResponse(res, 200, { appointment }, 'Appointment cancelled successfully');
  } catch (error) {
    next(error);
  }
};

const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, startTime } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.customer.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to reschedule this appointment', 403));
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return next(
        new AppError(`Cannot reschedule appointment with status '${appointment.status}'`, 400)
      );
    }

    const barber = await Barber.findById(appointment.barber);
    if (!barber || !barber.isAvailable) {
      return next(new AppError('Barber is not available', 400));
    }

    const newEndTime = addMinutesToTime(startTime, appointment.totalDuration);

    const newDate = new Date(date);

    // Validate: không cho đổi lịch sang ngày quá khứ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      return next(new AppError('Cannot reschedule to a past date', 400));
    }

    const dayName = getDayName(newDate);
    const workingDay = barber.workingHours[dayName];

    if (workingDay.isOff) {
      return next(new AppError(`Barber is not working on ${dayName}`, 400));
    }

    const workStart = timeToMinutes(workingDay.start);
    const workEnd = timeToMinutes(workingDay.end);
    const appointmentStart = timeToMinutes(startTime);
    const appointmentEnd = timeToMinutes(newEndTime);

    if (appointmentStart < workStart || appointmentEnd > workEnd) {
      return next(
        new AppError(
          `Appointment must be within barber's working hours (${workingDay.start} - ${workingDay.end})`,
          400
        )
      );
    }

    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(newDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      _id: { $ne: id },
      barber: appointment.barber,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    });

    for (const existing of existingAppointments) {
      if (isOverlapping(startTime, newEndTime, existing.startTime, existing.endTime)) {
        return next(
          new AppError(
            `Time slot conflicts with an existing appointment (${existing.startTime} - ${existing.endTime})`,
            400
          )
        );
      }
    }

    appointment.date = newDate;
    appointment.startTime = startTime;
    appointment.endTime = newEndTime;
    appointment.status = 'pending';
    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    sendResponse(res, 200, { appointment }, 'Appointment rescheduled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  confirmAppointment,
  rejectAppointment,
  startAppointment,
  completeAppointment,
  cancelAppointment,
  rescheduleAppointment
};
