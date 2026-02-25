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

module.exports = {
  getAvailableBarbers
};
