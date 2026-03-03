const mongoose = require('mongoose');

const workingDaySchema = new mongoose.Schema(
  {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '18:00'
    },
    isOff: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const barberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop reference is required']
    },
    bio: {
      type: String
    },
    skills: {
      type: [String],
      default: []
    },
    portfolio: {
      type: [String],
      default: []
    },
    workingHours: {
      monday: {
        type: workingDaySchema,
        default: () => ({})
      },
      tuesday: {
        type: workingDaySchema,
        default: () => ({})
      },
      wednesday: {
        type: workingDaySchema,
        default: () => ({})
      },
      thursday: {
        type: workingDaySchema,
        default: () => ({})
      },
      friday: {
        type: workingDaySchema,
        default: () => ({})
      },
      saturday: {
        type: workingDaySchema,
        default: () => ({})
      },
      sunday: {
        type: workingDaySchema,
        default: () => ({ isOff: true })
      }
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

barberSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

const Barber = mongoose.model('Barber', barberSchema);

module.exports = Barber;
