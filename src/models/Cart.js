const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    place: {
      type: String,
      default: '',
    },
    time: {
      type: String,
      default: '',
    },
    venue: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
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

cartSchema.index({ createdBy: 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
