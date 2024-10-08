const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A name is required'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        "A tour name can't reach or exceed 40 characters",
      ],
      minlength: [
        5,
        "A tour name can't be less than 5 characters",
      ],
      validate: [
        validator.isAlpha,
        'Tour name must only contain characters',
      ],
    },
    slug: String,
    duration: {
      type: Number,
      requied: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'Difficulty is either easy, medium or difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Raiting must be less than or equal 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,

      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'price must be greater than discount',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
//Document middleware runs before save() and create() but not .insertMany
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { tolower: true });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});
//Aggregation middleware
tourSchema.pre('aggregate', function (next) {
  this._pipeline.unshift({
    $match: { secretTour: { $ne: true } },
  });
  next();
});
// tourSchema.pre('save', function (next) {
//   console.log('Will save doc..');
//   next();
// });
// tourSchema.post('save', function (document, next) {
//   console.log(document);
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
