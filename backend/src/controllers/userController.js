const User = require('../models/User');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { deleteFile } = require('../middlewares/upload');

const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    sendResponse(res, 200, {
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers: total,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers
};
