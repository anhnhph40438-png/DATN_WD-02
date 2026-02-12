const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment is required']
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    vnpTxnRef: {
      type: String,
      required: [true, 'VNPay transaction reference is required'],
      unique: true
    },
    vnpTransactionNo: {
      type: String
    },
    vnpResponseCode: {
      type: String
    },
    vnpBankCode: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      default: 'vnpay'
    },
    paidAt: {
      type: Date
    },
    refundedAt: {
      type: Date
    },
    refundAmount: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ vnpTxnRef: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
