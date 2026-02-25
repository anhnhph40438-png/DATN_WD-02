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

const sendInvoiceEmail = async (transaction, appointment) => {
  const customer = await User.findById(appointment.customer);
  if (!customer) return;

  const appointmentDate = new Date(appointment.date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #27ae60; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Payment Successful!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Hi ${customer.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Your payment has been successfully processed. Here are the details:
                  </p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f8f8; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Transaction ID:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${transaction.vnpTxnRef}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Appointment Date:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointmentDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Time:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointment.startTime} - ${appointment.endTime}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Payment Method:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">VNPay</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-top: 1px solid #dddddd; color: #666666; font-size: 14px;">Amount Paid:</td>
                            <td style="padding: 10px 0; border-top: 1px solid #dddddd; color: #27ae60; font-size: 18px; font-weight: bold; text-align: right;">${transaction.amount.toLocaleString('vi-VN')} VND</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Thank you for using Barberly. We look forward to seeing you!
                  </p>
                  <table role="presentation" style="margin: 30px auto;">
                    <tr>
                      <td style="border-radius: 4px; background-color: #1a1a2e;">
                        <a href="${CLIENT_URL}/appointments" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                          View My Appointments
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Best regards,<br>The Barberly Team
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to: customer.email,
      subject: 'Payment Confirmation - Barberly',
      html
    });
  } catch (error) {
    console.error('Error sending invoice email:', error.message);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const customerId = req.user._id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('services', 'name price');

    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.customer.toString() !== customerId.toString()) {
      return next(new AppError('You do not have permission to pay for this appointment', 403));
    }

    if (appointment.paymentStatus === 'paid') {
      return next(new AppError('This appointment has already been paid', 400));
    }

    const existingTransaction = await Transaction.findOne({
      appointment: appointmentId,
      status: 'pending'
    });

    if (existingTransaction) {
      const vnpTxnRef = generateTxnRef();
      existingTransaction.vnpTxnRef = vnpTxnRef;
      await existingTransaction.save();

      const ipAddr = getClientIp(req);
      const paymentUrl = createPaymentUrl(appointment, vnpTxnRef, ipAddr);

      return sendResponse(res, 200, { paymentUrl }, 'Payment URL created successfully');
    }

    const vnpTxnRef = generateTxnRef();

    await Transaction.create({
      appointment: appointmentId,
      customer: customerId,
      amount: appointment.totalPrice,
      vnpTxnRef,
      status: 'pending',
      paymentMethod: 'vnpay'
    });

    const ipAddr = getClientIp(req);

    const paymentUrl = createPaymentUrl(appointment, vnpTxnRef, ipAddr);

    sendResponse(res, 200, { paymentUrl }, 'Payment URL created successfully');
  } catch (error) {
    next(error);
  }
};

const vnpayReturn = async (req, res, next) => {
  try {
    const verification = verifyReturnUrl(req.query);

    const transaction = await Transaction.findOne({
      vnpTxnRef: verification.txnRef
    });

    if (!transaction) {
      return res.redirect(`${CLIENT_URL}/payment/result?success=false&message=Transaction not found`);
    }

    if (verification.isValid) {
      transaction.vnpTransactionNo = verification.transactionNo;
      transaction.vnpResponseCode = verification.responseCode;
      transaction.vnpBankCode = verification.bankCode;

      if (verification.responseCode === '00') {
        transaction.status = 'success';
        transaction.paidAt = new Date();
        await transaction.save();

        const appointment = await Appointment.findById(transaction.appointment);
        if (appointment) {
          appointment.paymentStatus = 'paid';
          appointment.paymentMethod = 'vnpay';
          await appointment.save();

          await sendInvoiceEmail(transaction, appointment);
        }

        return res.redirect(
          `${CLIENT_URL}/payment/result?success=true&txnRef=${verification.txnRef}&amount=${verification.amount}`
        );
      } else {
        transaction.status = 'failed';
        await transaction.save();

        const message = encodeURIComponent(getResponseMessage(verification.responseCode));
        return res.redirect(
          `${CLIENT_URL}/payment/result?success=false&message=${message}&code=${verification.responseCode}`
        );
      }
    } else {
      transaction.status = 'failed';
      transaction.vnpResponseCode = 'INVALID_SIGNATURE';
      await transaction.save();

      return res.redirect(`${CLIENT_URL}/payment/result?success=false&message=Invalid signature`);
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    return res.redirect(`${CLIENT_URL}/payment/result?success=false&message=Payment processing error`);
  }
};

const vnpayIpn = async (req, res) => {
  try {
    const verification = verifyIpn(req.query);

    if (!verification.isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const transaction = await Transaction.findOne({
      vnpTxnRef: verification.txnRef
    });

    if (!transaction) {
      return res.status(200).json({ RspCode: '01', Message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(200).json({ RspCode: '02', Message: 'Transaction already processed' });
    }

    if (transaction.amount !== verification.amount) {
      return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
    }

    transaction.vnpTransactionNo = verification.transactionNo;
    transaction.vnpResponseCode = verification.responseCode;
    transaction.vnpBankCode = verification.bankCode;

    if (verification.responseCode === '00') {
      transaction.status = 'success';
      transaction.paidAt = new Date();
      await transaction.save();

      const appointment = await Appointment.findById(transaction.appointment);
      if (appointment) {
        appointment.paymentStatus = 'paid';
        appointment.paymentMethod = 'vnpay';
        await appointment.save();

        await sendInvoiceEmail(transaction, appointment);
      }
    } else {
      transaction.status = 'failed';
      await transaction.save();
    }

    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    console.error('VNPay IPN error:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const transactions = await Transaction.find(query)
      .populate('customer', 'name email phone')
      .populate({
        path: 'appointment',
        select: 'date startTime endTime totalPrice status',
        populate: [
          { path: 'barber', populate: { path: 'user', select: 'name' } },
          { path: 'services', select: 'name price' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Transaction.countDocuments(query);

    sendResponse(
      res,
      200,
      {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      'Transactions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};