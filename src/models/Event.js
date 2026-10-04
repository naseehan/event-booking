const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    place: {
      type: String,
      required: [true, 'Place/City is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Price must be non-negative'],
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimized searching and sorting
eventSchema.index({ category: 1 });
eventSchema.index({ price: 1 });
eventSchema.index({ createdBy: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
