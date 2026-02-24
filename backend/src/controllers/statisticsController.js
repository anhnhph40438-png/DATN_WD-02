const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Barber = require('../models/Barber');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const getDateRange = (period, startDate, endDate) => {
  const now = new Date();

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  let start, end;

  switch (period) {
    case 'day':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;

    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;

    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      break;

    default:
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

const generateDateLabels = (period, start, end) => {
  const labels = [];
  const current = new Date(start);

  while (current <= end) {
    switch (period) {
      case 'day':
        labels.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
        break;

      case 'week':
        labels.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
        break;

      case 'month':
        labels.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
        break;

      case 'year':
        const monthLabel = current.toLocaleString('vi-VN', { month: 'short', year: 'numeric' });
        labels.push(monthLabel);
        current.setMonth(current.getMonth() + 1);
        break;

      default:
        labels.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
  }

  return labels;
};

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalCustomers,
      totalBarbers,
      totalAppointments,
      totalRevenueResult,
      todayAppointments,
      pendingAppointments,
      recentAppointments
    ] = await Promise.all([
      User.countDocuments({ role: 'customer', isActive: true }),

      Barber.countDocuments({ isAvailable: true }),

      Appointment.countDocuments(),

      Transaction.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      Appointment.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd }
      }),

      Appointment.countDocuments({ status: 'pending' }),

      Appointment.find()
        .populate('customer', 'name email phone avatar')
        .populate({
          path: 'barber',
          populate: { path: 'user', select: 'name avatar' }
        })
        .populate('services', 'name price')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    sendResponse(
      res,
      200,
      {
        totalCustomers,
        totalBarbers,
        totalAppointments,
        totalRevenue,
        todayAppointments,
        pendingAppointments,
        recentAppointments
      },
      'Dashboard statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};