const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access.', 401)
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired. Please log in again.', 401));
      }
      if (err.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token. Please log in again.', 401));
      }
      throw err;
    }

    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    if (!currentUser.isActive) {
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 401)
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};