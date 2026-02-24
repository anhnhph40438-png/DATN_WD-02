const Appointment = require('../models/Appointment');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const Shop = require('../models/Shop');
const User = require('../models/User');
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
    const { barberId, serviceIds, date, startTime, notes } = req.body;
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

    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);

    const endTime = addMinutesToTime(startTime, totalDuration);

    const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

    const appointmentDate = new Date(date);
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
      const barber = await Barber.findOne({ user: userId });
      if (!barber) {
        return next(new AppError('Barber profile not found', 404));
      }
      query.barber = barber._id;
    }

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

    sendResponse(
      res,
      200,
      {
        appointments,
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
    } else if (userRole === 'barber') {
      const barber = await Barber.findOne({ user: userId });
      if (!barber || appointment.barber._id.toString() !== barber._id.toString()) {
        return next(new AppError('You do not have permission to view this appointment', 403));
      }
    }

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

    const barber = await Barber.findOne({ user: req.user._id });
    if (!barber || appointment.barber.toString() !== barber._id.toString()) {
      return next(new AppError('You do not have permission to confirm this appointment', 403));
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

    const barber = await Barber.findOne({ user: req.user._id });
    if (!barber || appointment.barber.toString() !== barber._id.toString()) {
      return next(new AppError('You do not have permission to reject this appointment', 403));
    }

    if (appointment.status !== 'pending') {
      return next(
        new AppError(`Cannot reject appointment with status '${appointment.status}'`, 400)
      );
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = reason || 'Rejected by barber';
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

    const barber = await Barber.findOne({ user: req.user._id });
    if (!barber || appointment.barber.toString() !== barber._id.toString()) {
      return next(new AppError('You do not have permission to start this appointment', 403));
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

    const barber = await Barber.findOne({ user: req.user._id });
    if (!barber || appointment.barber.toString() !== barber._id.toString()) {
      return next(new AppError('You do not have permission to complete this appointment', 403));
    }

    if (appointment.status !== 'in-progress') {
      return next(
        new AppError(`Cannot complete appointment with status '${appointment.status}'`, 400)
      );
    }

    appointment.status = 'completed';
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