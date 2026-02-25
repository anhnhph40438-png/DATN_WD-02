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

const createBarber = async (req, res, next) => {
  try {
    const { name, email, phone, password, bio, skills } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return next(
        new AppError(
          existingUser.email === email
            ? 'Email already registered'
            : 'Phone number already registered',
          400
        )
      );
    }

    const shop = await getDefaultShop();

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'barber'
    });

    const barber = await Barber.create({
      user: user._id,
      shop: shop._id,
      bio,
      skills: skills || []
    });

    await barber.populate('user', 'name email phone avatar');

    sendResponse(
      res,
      201,
      { barber },
      'Barber created successfully'
    );
  } catch (error) {
    next(error);
  }
};

const updateBarber = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bio, skills, portfolio } = req.body;

    const barber = await Barber.findById(id);

    if (!barber) {
      return next(new AppError('Barber not found', 404));
    }

    if (req.user.role !== 'admin' && barber.user.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to update this profile', 403));
    }

    if (bio !== undefined) barber.bio = bio;
    if (skills !== undefined) barber.skills = skills;
    if (portfolio !== undefined) barber.portfolio = portfolio;

    await barber.save();

    await barber.populate('user', 'name email phone avatar');

    sendResponse(res, 200, { barber }, 'Barber profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const updateWorkingHours = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workingHours } = req.body;

    if (!workingHours || typeof workingHours !== 'object') {
      return next(new AppError('Working hours object is required', 400));
    }

    const barber = await Barber.findById(id);

    if (!barber) {
      return next(new AppError('Barber not found', 404));
    }

    if (req.user.role !== 'admin' && barber.user.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to update this schedule', 403));
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of validDays) {
      if (workingHours[day]) {
        const daySchedule = workingHours[day];

        if (daySchedule.start !== undefined) {
          barber.workingHours[day].start = daySchedule.start;
        }
        if (daySchedule.end !== undefined) {
          barber.workingHours[day].end = daySchedule.end;
        }
        if (daySchedule.isOff !== undefined) {
          barber.workingHours[day].isOff = daySchedule.isOff;
        }
      }
    }

    await barber.save();

    sendResponse(
      res,
      200,
      { workingHours: barber.workingHours },
      'Working hours updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

const toggleBarberStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id);

    if (!barber) {
      return next(new AppError('Barber not found', 404));
    }

    barber.isAvailable = !barber.isAvailable;
    await barber.save();

    sendResponse(
      res,
      200,
      { barber: { _id: barber._id, isAvailable: barber.isAvailable } },
      `Barber ${barber.isAvailable ? 'is now available' : 'is now unavailable'}`
    );
  } catch (error) {
    next(error);
  }
};

const deleteBarber = async (req, res, next) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id).populate('user');

    if (!barber) {
      return next(new AppError('Barber not found', 404));
    }

    if (barber.user && barber.user.avatar) {
      await deleteFile(barber.user.avatar);
    }

    await Barber.findByIdAndDelete(id);

    if (barber.user) {
      await User.findByIdAndDelete(barber.user._id);
    }

    sendResponse(res, 200, null, 'Barber and associated user deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return next(new AppError('Date query parameter is required', 400));
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return next(new AppError('Invalid date format. Use YYYY-MM-DD', 400));
    }

    const barber = await Barber.findById(id);
    if (!barber) {
      return next(new AppError('Barber not found', 404));
    }

    if (!barber.isAvailable) {
      return sendResponse(res, 200, { availableSlots: [], message: 'Barber is not available' }, 'Barber is currently not available');
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[targetDate.getDay()];

    const workingDay = barber.workingHours[dayOfWeek];

    if (workingDay.isOff) {
      return sendResponse(res, 200, { availableSlots: [], message: `Barber is off on ${dayOfWeek}` }, 'Barber is off on this day');
    }

    const startTime = workingDay.start;
    const endTime = workingDay.end;
    const allSlots = generateTimeSlots(startTime, endTime, 30);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      barber: id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $nin: ['cancelled'] }
    });

    const bookedSlots = new Set();
    existingAppointments.forEach(appointment => {
      const appointmentSlots = generateTimeSlots(
        appointment.startTime,
        appointment.endTime,
        30
      );
      appointmentSlots.forEach(slot => bookedSlots.add(slot));
    });

    const availableSlots = allSlots.filter(slot => !bookedSlots.has(slot));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    let finalSlots = availableSlots;
    if (targetDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      finalSlots = availableSlots.filter(slot => {
        const [hour, minute] = slot.split(':').map(Number);
        const slotTimeInMinutes = hour * 60 + minute;
        return slotTimeInMinutes > currentTimeInMinutes + 30;
      });
    }

    sendResponse(
      res,
      200,
      {
        date: date,
        dayOfWeek,
        workingHours: { start: startTime, end: endTime },
        availableSlots: finalSlots
      },
      'Available slots retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const generateTimeSlots = (start, end, intervalMinutes) => {
  const slots = [];
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    );
    currentMinutes += intervalMinutes;
  }

  return slots;
};

module.exports = {
  getAvailableBarbers,
  getAllBarbers,
  getBarberById,
  createBarber,
  updateBarber,
  updateWorkingHours,
  toggleBarberStatus,
  deleteBarber,
  getAvailableSlots
};
