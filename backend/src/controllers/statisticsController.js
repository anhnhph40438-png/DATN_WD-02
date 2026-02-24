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

const getRevenueStats = async (req, res, next) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    const { start, end } = getDateRange(period, startDate, endDate);

    let groupFormat;
    switch (period) {
      case 'day':
      case 'week':
      case 'month':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } };
        break;
      case 'year':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$paidAt' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } };
    }

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          status: 'success',
          paidAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const total = revenueData.reduce((sum, item) => sum + item.revenue, 0);

    const labels = revenueData.map((item) => item._id);
    const data = revenueData.map((item) => item.revenue);
    const transactionCounts = revenueData.map((item) => item.count);

    sendResponse(
      res,
      200,
      {
        labels,
        data,
        transactionCounts,
        total,
        period,
        startDate: start,
        endDate: end
      },
      'Revenue statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getAppointmentStats = async (req, res, next) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    const { start, end } = getDateRange(period, startDate, endDate);

    const byStatusResult = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const byStatus = {
      pending: 0,
      confirmed: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0
    };

    byStatusResult.forEach((item) => {
      byStatus[item._id] = item.count;
    });

    let groupFormat;
    switch (period) {
      case 'day':
      case 'week':
      case 'month':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
        break;
      case 'year':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    }

    const byPeriodResult = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const byPeriod = byPeriodResult.map((item) => ({
      date: item._id,
      count: item.count
    }));

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    sendResponse(
      res,
      200,
      {
        byStatus,
        byPeriod,
        total,
        period,
        startDate: start,
        endDate: end
      },
      'Appointment statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getCustomerStats = async (req, res, next) => {
  try {
    const now = new Date();

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      newCustomersThisWeek,
      newCustomersThisMonth,
      topCustomersResult
    ] = await Promise.all([
      User.countDocuments({ role: 'customer', isActive: true }),

      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: weekStart }
      }),

      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: monthStart }
      }),

      Appointment.aggregate([
        {
          $match: {
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$customer',
            appointmentCount: { $sum: 1 },
            totalSpent: { $sum: '$totalPrice' }
          }
        },
        {
          $sort: { appointmentCount: -1, totalSpent: -1 }
        },
        {
          $limit: 10
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            user: {
              _id: '$user._id',
              name: '$user.name',
              email: '$user.email',
              phone: '$user.phone',
              avatar: '$user.avatar'
            },
            appointmentCount: 1,
            totalSpent: 1
          }
        }
      ])
    ]);

    sendResponse(
      res,
      200,
      {
        totalCustomers,
        newCustomers: {
          thisWeek: newCustomersThisWeek,
          thisMonth: newCustomersThisMonth
        },
        topCustomers: topCustomersResult
      },
      'Customer statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getBarberStats = async (req, res, next) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    const { start, end } = getDateRange(period, startDate, endDate);

    const barberStats = await Barber.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $lookup: {
          from: 'appointments',
          let: { barberId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$barber', '$$barberId'] },
                    { $gte: ['$date', start] },
                    { $lte: ['$date', end] }
                  ]
                }
              }
            }
          ],
          as: 'appointments'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'barber',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          appointmentCount: { $size: '$appointments' },
          completedCount: {
            $size: {
              $filter: {
                input: '$appointments',
                as: 'apt',
                cond: { $eq: ['$$apt.status', 'completed'] }
              }
            }
          },
          revenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$appointments',
                    as: 'apt',
                    cond: {
                      $and: [
                        { $eq: ['$$apt.status', 'completed'] },
                        { $eq: ['$$apt.paymentStatus', 'paid'] }
                      ]
                    }
                  }
                },
                as: 'paidApt',
                in: '$$paidApt.totalPrice'
              }
            }
          },
          averageRating: '$rating',
          reviewCount: '$totalReviews'
        }
      },
      {
        $project: {
          barber: {
            _id: '$_id',
            user: {
              _id: '$userInfo._id',
              name: '$userInfo.name',
              email: '$userInfo.email',
              phone: '$userInfo.phone',
              avatar: '$userInfo.avatar'
            },
            rating: '$rating',
            totalReviews: '$totalReviews',
            isAvailable: '$isAvailable'
          },
          appointmentCount: 1,
          completedCount: 1,
          revenue: 1,
          averageRating: 1,
          reviewCount: 1
        }
      },
      {
        $sort: { completedCount: -1, revenue: -1 }
      }
    ]);

    sendResponse(
      res,
      200,
      {
        barbers: barberStats,
        period,
        startDate: start,
        endDate: end
      },
      'Barber statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getBarberPersonalStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period = 'month', startDate, endDate } = req.query;

    let barber;

    if (id) {
      barber = await Barber.findById(id).populate('user', 'name email phone avatar');

      if (!barber) {
        return next(new AppError('Barber not found', 404));
      }

      if (req.user.role === 'barber') {
        const userBarber = await Barber.findOne({ user: req.user._id });
        if (!userBarber || userBarber._id.toString() !== id) {
          return next(new AppError('You can only view your own statistics', 403));
        }
      }
    } else {
      barber = await Barber.findOne({ user: req.user._id }).populate(
        'user',
        'name email phone avatar'
      );

      if (!barber) {
        return next(new AppError('Barber profile not found', 404));
      }
    }

    const { start, end } = getDateRange(period, startDate, endDate);
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalAppointments,
      appointmentsByStatus,
      periodRevenue,
      todayAppointments,
      upcomingAppointments,
      recentReviews
    ] = await Promise.all([
      Appointment.countDocuments({
        barber: barber._id,
        date: { $gte: start, $lte: end }
      }),

      Appointment.aggregate([
        {
          $match: {
            barber: barber._id,
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      Appointment.aggregate([
        {
          $match: {
            barber: barber._id,
            date: { $gte: start, $lte: end },
            status: 'completed',
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]),

      Appointment.find({
        barber: barber._id,
        date: { $gte: todayStart, $lte: todayEnd }
      })
        .populate('customer', 'name email phone avatar')
        .populate('services', 'name price duration')
        .sort({ startTime: 1 }),

      Appointment.find({
        barber: barber._id,
        date: { $gte: todayStart },
        status: { $in: ['pending', 'confirmed'] }
      })
        .populate('customer', 'name email phone avatar')
        .populate('services', 'name price duration')
        .sort({ date: 1, startTime: 1 })
        .limit(10),

      Review.find({ barber: barber._id })
        .populate('customer', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const byStatus = {
      pending: 0,
      confirmed: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0
    };

    appointmentsByStatus.forEach((item) => {
      byStatus[item._id] = item.count;
    });

    const revenue = periodRevenue.length > 0 ? periodRevenue[0].total : 0;

    sendResponse(
      res,
      200,
      {
        barber: {
          _id: barber._id,
          user: barber.user,
          rating: barber.rating,
          totalReviews: barber.totalReviews
        },
        statistics: {
          totalAppointments,
          byStatus,
          revenue,
          completionRate:
            totalAppointments > 0
              ? Math.round((byStatus.completed / totalAppointments) * 100)
              : 0
        },
        todayAppointments,
        upcomingAppointments,
        recentReviews,
        period,
        startDate: start,
        endDate: end
      },
      'Barber personal statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getRevenueStats,
  getAppointmentStats,
  getCustomerStats,
  getBarberStats,
  getBarberPersonalStats
};
