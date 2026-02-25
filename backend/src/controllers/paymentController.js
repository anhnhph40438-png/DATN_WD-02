const Transaction = require('../models/Transaction');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { sendEmail } = require('../services/emailService');
const {
  createPaymentUrl,
  verifyReturnUrl,
  verifyIpn,
  getResponseMessage
} = require('../services/vnpayService');
const { CLIENT_URL } = require('../config/env');

const generateTxnRef = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}${random}`;
};

const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
};