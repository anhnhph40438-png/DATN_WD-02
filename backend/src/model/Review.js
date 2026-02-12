const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required']
    },
    barber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barber',
      required: [true, 'Barber is required']
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment is required'],
      unique: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.statics.calculateAverageRating = async function (barberId) {
  const stats = await this.aggregate([
    {
      $match: { barber: barberId }
    },
    {
      $group: {
        _id: '$barber',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Barber').findByIdAndUpdate(barberId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews
    });
  } else {
    await mongoose.model('Barber').findByIdAndUpdate(barberId, {
      rating: 0,
      totalReviews: 0
    });
  }
};

reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.barber);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.barber);
  }
});

reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.calculateAverageRating(this.barber);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
