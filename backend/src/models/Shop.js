const mongoose = require('mongoose');

const dayScheduleSchema = new mongoose.Schema(
  {
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '18:00'
    },
    isClosed: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Shop address is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Shop phone is required'],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    description: {
      type: String
    },
    images: {
      type: [String],
      default: []
    },
    openingHours: {
      monday: {
        type: dayScheduleSchema,
        default: () => ({})
      },
      tuesday: {
        type: dayScheduleSchema,
        default: () => ({})
      },
      wednesday: {
        type: dayScheduleSchema,
        default: () => ({})
      },
      thursday: {
        type: dayScheduleSchema,
        default: () => ({})
      },
      friday: {
        type: dayScheduleSchema,
        default: () => ({})
      },
      saturday: {
        type: dayScheduleSchema,
        default: () => ({})
      },
      sunday: {
        type: dayScheduleSchema,
        default: () => ({ isClosed: true })
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
