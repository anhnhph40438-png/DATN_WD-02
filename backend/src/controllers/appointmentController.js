const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const Barber = require('../models/Barber');
const Review = require('../models/Review');
const Service = require('../models/Service');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const {
  sendAppointmentConfirmation,
  sendRescheduleRequestEmail,
  sendRescheduleNotificationEmail,
  sendRescheduleResponseEmail,
  sendWalkInAccountEmail,
  sendWalkInBookingEmail
} = require('../services/emailService');
const { CLIENT_URL } = require('../config/env');

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
    } else if (userRole === 'barber') {
      const barberProfile = await Barber.findOne({ user: userId }).select('_id');
      if (!barberProfile) {
        return sendResponse(res, 200, { appointments: [], pagination: { total: 0, page: 1, pages: 0 } }, 'No barber profile');
      }
      query.barber = barberProfile._id;
    }
    // admin sees all appointments

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

// Helper: validate new slot for reschedule (shared logic)
const validateRescheduleSlot = async (appointment, newDate, startTime, excludeId) => {
  const barber = await Barber.findById(appointment.barber);
  if (!barber || !barber.isAvailable) {
    throw new AppError('Barber is not available', 400);
  }

  const newEndTime = addMinutesToTime(startTime, appointment.totalDuration);

  // Validate: không cho đổi lịch sang ngày quá khứ
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (newDate < today) {
    throw new AppError('Cannot reschedule to a past date', 400);
  }

  const dayName = getDayName(newDate);
  const workingDay = barber.workingHours[dayName];

  if (workingDay.isOff) {
    throw new AppError(`Barber is not working on ${dayName}`, 400);
  }

  const workStart = timeToMinutes(workingDay.start);
  const workEnd = timeToMinutes(workingDay.end);
  const appointmentStart = timeToMinutes(startTime);
  const appointmentEnd = timeToMinutes(newEndTime);

  if (appointmentStart < workStart || appointmentEnd > workEnd) {
    throw new AppError(
      `Appointment must be within barber's working hours (${workingDay.start} - ${workingDay.end})`,
      400
    );
  }

  const startOfDay = new Date(newDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(newDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await Appointment.find({
    _id: { $ne: excludeId },
    barber: appointment.barber,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['cancelled'] }
  });

  for (const existing of existingAppointments) {
    if (isOverlapping(startTime, newEndTime, existing.startTime, existing.endTime)) {
      throw new AppError(
        `Time slot conflicts with an existing appointment (${existing.startTime} - ${existing.endTime})`,
        400
      );
    }
  }

  return { newEndTime, barber };
};

const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, startTime, reason } = req.body;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return next(
        new AppError(`Cannot reschedule appointment with status '${appointment.status}'`, 400)
      );
    }

    const newDate = new Date(date);

    // Validate slot (throws AppError on failure)
    let newEndTime, barber;
    try {
      ({ newEndTime, barber } = await validateRescheduleSlot(appointment, newDate, startTime, id));
    } catch (err) {
      return next(err);
    }

    if (userRole === 'customer') {
      // Customer must own the appointment
      if (appointment.customer.toString() !== req.user._id.toString()) {
        return next(new AppError('You do not have permission to reschedule this appointment', 403));
      }

      // Customer reschedules directly
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

      return sendResponse(res, 200, { appointment }, 'Appointment rescheduled successfully');
    }

    if (userRole === 'admin') {
      // Save old schedule before updating
      const oldDate = appointment.date;
      const oldStartTime = appointment.startTime;
      const oldEndTime = appointment.endTime;

      // Admin reschedules directly and notifies customer
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

      try {
        await sendRescheduleNotificationEmail({
          customer: appointment.customer,
          oldDate,
          oldStartTime,
          oldEndTime,
          newDate,
          newStartTime: startTime,
          newEndTime
        });
      } catch (emailError) {
        console.error('Error sending reschedule notification email:', emailError.message);
      }

      return sendResponse(res, 200, { appointment }, 'Appointment rescheduled successfully');
    }

    if (userRole === 'barber') {
      // Verify barber is assigned to this appointment
      const barberProfile = await Barber.findOne({ user: req.user._id });
      if (!barberProfile || appointment.barber._id.toString() !== barberProfile._id.toString()) {
        return next(new AppError('You can only reschedule your own appointments', 403));
      }

      // Check for existing pending reschedule request
      if (
        appointment.rescheduleRequest &&
        appointment.rescheduleRequest.status === 'pending'
      ) {
        return next(new AppError('There is already a pending reschedule request for this appointment', 400));
      }

      // Generate token
      const plainToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      appointment.rescheduleRequest = {
        newDate,
        newStartTime: startTime,
        newEndTime,
        reason,
        token: hashedToken,
        tokenExpires,
        status: 'pending',
        requestedBy: req.user._id,
        createdAt: new Date()
      };
      await appointment.save();

      await appointment.populate([
        { path: 'customer', select: 'name email phone avatar' },
        { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
        { path: 'shop', select: 'name address phone' },
        { path: 'services', select: 'name price duration' }
      ]);

      const acceptUrl = `${CLIENT_URL}/reschedule-confirm/${plainToken}?action=accept`;
      const rejectUrl = `${CLIENT_URL}/reschedule-confirm/${plainToken}?action=reject`;

      try {
        await sendRescheduleRequestEmail({
          customer: appointment.customer,
          barber: appointment.barber.user,
          appointment: {
            date: appointment.date,
            startTime: appointment.startTime,
            endTime: appointment.endTime
          },
          newDate,
          newStartTime: startTime,
          newEndTime,
          reason,
          acceptUrl,
          rejectUrl
        });
      } catch (emailError) {
        console.error('Error sending reschedule request email:', emailError.message);
      }

      return sendResponse(res, 200, { appointment }, 'Reschedule request sent to customer');
    }

    return next(new AppError('Unauthorized role', 403));
  } catch (error) {
    next(error);
  }
};

const rescheduleRespond = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return next(new AppError('Action must be accept or reject', 400));
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    // Only the appointment's customer can respond
    if (
      !appointment.customer ||
      appointment.customer.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('You do not have permission to respond to this reschedule request', 403));
    }

    if (
      !appointment.rescheduleRequest ||
      appointment.rescheduleRequest.status !== 'pending'
    ) {
      return next(new AppError('No pending reschedule request found for this appointment', 400));
    }

    const rescheduleNewDate = appointment.rescheduleRequest.newDate;
    const rescheduleNewStartTime = appointment.rescheduleRequest.newStartTime;

    if (action === 'accept') {
      appointment.date = rescheduleNewDate;
      appointment.startTime = rescheduleNewStartTime;
      appointment.endTime = appointment.rescheduleRequest.newEndTime;
      appointment.rescheduleRequest.status = 'accepted';
    } else {
      appointment.rescheduleRequest.status = 'rejected';
    }
    appointment.rescheduleRequest.respondedAt = new Date();

    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    try {
      await sendRescheduleResponseEmail({
        barber: appointment.barber.user,
        customer: appointment.customer,
        action,
        appointment: {
          date: appointment.date,
          startTime: appointment.startTime
        },
        newDate: rescheduleNewDate,
        newStartTime: rescheduleNewStartTime
      });
    } catch (emailError) {
      console.error('Error sending reschedule response email:', emailError.message);
    }

    sendResponse(
      res,
      200,
      { appointment },
      `Reschedule request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

const rescheduleConfirmByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { action } = req.query;

    if (!['accept', 'reject'].includes(action)) {
      return next(new AppError('Action must be accept or reject', 400));
    }

    // Hash the received token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const appointment = await Appointment.findOne({
      'rescheduleRequest.token': hashedToken,
      'rescheduleRequest.tokenExpires': { $gt: new Date() },
      'rescheduleRequest.status': 'pending'
    });

    if (!appointment) {
      return next(new AppError('Invalid or expired reschedule token', 400));
    }

    const rescheduleNewDate = appointment.rescheduleRequest.newDate;
    const rescheduleNewStartTime = appointment.rescheduleRequest.newStartTime;

    if (action === 'accept') {
      appointment.date = rescheduleNewDate;
      appointment.startTime = rescheduleNewStartTime;
      appointment.endTime = appointment.rescheduleRequest.newEndTime;
      appointment.rescheduleRequest.status = 'accepted';
    } else {
      appointment.rescheduleRequest.status = 'rejected';
    }
    appointment.rescheduleRequest.respondedAt = new Date();

    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    try {
      await sendRescheduleResponseEmail({
        barber: appointment.barber.user,
        customer: appointment.customer,
        action,
        appointment: {
          date: appointment.date,
          startTime: appointment.startTime
        },
        newDate: rescheduleNewDate,
        newStartTime: rescheduleNewStartTime
      });
    } catch (emailError) {
      console.error('Error sending reschedule response email:', emailError.message);
    }

    sendResponse(
      res,
      200,
      { appointment },
      `Reschedule request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

const walkInBooking = async (req, res, next) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      barberId,
      serviceIds,
      date,
      startTime,
      notes,
      promoCode
    } = req.body;

    if (!customerId && !customerPhone) {
      return next(new AppError('Customer ID or customer phone is required', 400));
    }

    // Resolve customer
    let customer = null;
    let isNewAccount = false;
    let plainPassword = null;

    if (customerId) {
      customer = await User.findById(customerId);
      if (!customer) {
        return next(new AppError('Customer not found', 404));
      }
    } else if (customerPhone || customerEmail) {
      // Try to find by phone
      if (customerPhone) {
        customer = await User.findOne({ phone: customerPhone });
      }
      // Try to find by email if not found by phone
      if (!customer && customerEmail) {
        customer = await User.findOne({ email: customerEmail });
      }
      // If still not found and email provided, create new account
      if (!customer && customerEmail) {
        plainPassword = crypto.randomBytes(4).toString('hex');
        customer = await User.create({
          name: customerName || 'Walk-in Customer',
          email: customerEmail,
          phone: customerPhone || undefined,
          password: plainPassword,
          role: 'customer'
        });
        isNewAccount = true;
      }
    }
    // If no match and no email, customer remains null (walk-in only with name/phone)

    // Validate barber
    const barber = await Barber.findById(barberId).populate('user', 'name email');
    if (!barber) {
      return next(new AppError('Barber not found', 404));
    }
    if (!barber.isAvailable) {
      return next(new AppError('Barber is currently not available', 400));
    }

    // Validate services
    const services = await Service.find({
      _id: { $in: serviceIds },
      isActive: true
    });

    if (services.length !== serviceIds.length) {
      return next(new AppError('One or more services are invalid or inactive', 400));
    }

    const comboCount = services.filter(s => s.category === 'combo').length;
    if (comboCount > 1) {
      return next(new AppError('Mỗi lần đặt lịch chỉ được chọn tối đa 1 combo', 400));
    }

    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const endTime = addMinutesToTime(startTime, totalDuration);
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    const appointmentDate = new Date(date);

    // Validate date
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

          promotion.usedCount += 1;
          await promotion.save();
        }
      }
    }

    const appointmentData = {
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
      status: 'confirmed',
      bookingType: 'walk-in',
      createdBy: req.user._id
    };

    if (customer) {
      appointmentData.customer = customer._id;
    } else {
      appointmentData.walkInCustomerName = customerName;
      appointmentData.walkInCustomerPhone = customerPhone;
    }

    const appointment = await Appointment.create(appointmentData);

    await appointment.populate([
      { path: 'customer', select: 'name email phone avatar' },
      { path: 'barber', populate: { path: 'user', select: 'name email phone avatar' } },
      { path: 'shop', select: 'name address phone' },
      { path: 'services', select: 'name price duration' }
    ]);

    // Send emails
    if (customer) {
      try {
        if (isNewAccount) {
          await sendWalkInAccountEmail({
            customer,
            password: plainPassword,
            appointment
          });
        } else {
          await sendWalkInBookingEmail({
            customer,
            appointment
          });
        }
      } catch (emailError) {
        console.error('Error sending walk-in email:', emailError.message);
      }
    }

    sendResponse(res, 201, { appointment }, 'Walk-in appointment created successfully');
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
  rescheduleAppointment,
  rescheduleRespond,
  rescheduleConfirmByToken,
  walkInBooking
};
