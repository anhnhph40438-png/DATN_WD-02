const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true
    },
    description: {
      type: String
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [0, 'Price cannot be negative']
    },
    duration: {
      type: Number,
      required: [true, 'Service duration is required'],
      min: [5, 'Duration must be at least 5 minutes']
    },
    image: {
      type: String
    },
    category: {
      type: String,
      enum: ['haircut', 'shave', 'styling', 'combo', 'other'],
      default: 'other'
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

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
