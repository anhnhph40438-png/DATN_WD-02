const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/env');

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
};

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);

  const userData = user.toObject();
  delete userData.password;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: userData,
      token
    }
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

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

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'customer'
    });

    sendWelcomeEmail(user).catch((err) => {
      console.error('Failed to send welcome email:', err.message);
    });

    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!user.isActive) {
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 401)
      );
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    sendResponse(res, 200, { user }, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (email && email !== req.user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingEmail) {
        return next(new AppError('Email already in use', 400));
      }
    }

    if (phone && phone !== req.user.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (existingPhone) {
        return next(new AppError('Phone number already in use', 400));
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone },
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, { user: updatedUser }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    user.password = newPassword;
    await user.save();

    sendResponse(res, 200, null, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError('No user found with that email address', 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user, resetToken);

      sendResponse(
        res,
        200,
        null,
        'Password reset email sent. Please check your inbox.'
      );
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError('Error sending email. Please try again later.', 500)
      );
    }
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(
        new AppError('Password reset token is invalid or has expired', 400)
      );
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendResponse(
      res,
      200,
      null,
      'Password has been reset successfully. You can now log in with your new password.'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword
};
