const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    barber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barber',
      required: [true, 'Barber is required']
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop is required']
    },
    services: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service'
        }
      ],
      required: [true, 'At least one service is required'],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one service must be selected'
      }
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format']
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    },
    totalDuration: {
      type: Number,
      required: [true, 'Total duration is required'],
      min: [0, 'Total duration cannot be negative']
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'vnpay'],
      default: 'cash'
    },
    notes: {
      type: String
    },
    cancelReason: {
      type: String
    },
    promoCode: {
      type: String
    },
    discount: {
      type: Number,
      default: 0
    },
    finalPrice: {
      type: Number
    },

    // Walk-in booking fields
    bookingType: {
      type: String,
      enum: ['online', 'walk-in'],
      default: 'online'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    walkInCustomerName: {
      type: String,
      trim: true
    },
    walkInCustomerPhone: {
      type: String,
      trim: true
    },

    // Reschedule request from barber
    rescheduleRequest: {
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      newDate: Date,
      newStartTime: String,
      newEndTime: String,
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected']
      },
      token: String,
      tokenExpires: Date,
      createdAt: Date,
      respondedAt: Date
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.index({ barber: 1, date: 1, startTime: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
