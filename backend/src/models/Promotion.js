const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Promotion code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required']
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative']
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative']
    },
    maxDiscount: {
      type: Number,
      min: [0, 'Maximum discount cannot be negative']
    },
    usageLimit: {
      type: Number,
      min: [0, 'Usage limit cannot be negative']
    },
    usedCount: {
      type: Number,
      default: 0
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    applicableServices: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service'
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

promotionSchema.methods.isValid = function () {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, message: 'Promotion is not active' };
  }

  if (now < this.startDate) {
    return { valid: false, message: 'Promotion has not started yet' };
  }

  if (now > this.endDate) {
    return { valid: false, message: 'Promotion has expired' };
  }

  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Promotion usage limit reached' };
  }

  return { valid: true, message: 'Promotion is valid' };
};

promotionSchema.methods.calculateDiscount = function (orderAmount) {
  if (orderAmount < this.minOrderAmount) {
    return {
      discount: 0,
      message: `Minimum order amount is ${this.minOrderAmount}`
    };
  }

  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;

    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;

    if (discount > orderAmount) {
      discount = orderAmount;
    }
  }

  return {
    discount: Math.round(discount),
    finalAmount: Math.round(orderAmount - discount)
  };
};

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
