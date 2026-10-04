const Cart = require('../models/Cart');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { isDbConnected } = require('../config/db');

const getCart = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    throw ApiError.serviceUnavailable('Database connection is temporarily unavailable.');
  }

  const userId = req.userId;
  if (!userId) {
    throw ApiError.unauthorized('User authentication required');
  }

  const cartItems = await Cart.find({ createdBy: userId }).lean();
  return res.status(200).json(cartItems);
});

const addToCart = asyncHandler(async (req, res) => {
  const { name, place, price, time, venue, image, eventId } = req.body;
  const userId = req.userId;

  if (!userId) {
    throw ApiError.unauthorized('User authentication required');
  }

  if (!name || price === undefined) {
    throw ApiError.badRequest('Item name and price are required');
  }

  const cartItem = await Cart.create({
    name,
    place: place || '',
    price: Number(price),
    time: time || '',
    venue: venue || '',
    image: image || '',
    eventId: eventId || null,
    createdBy: userId,
  });

  return ApiResponse.created(res, cartItem, 'Saved to cart successfully');
});

const deleteCartItem = asyncHandler(async (req, res) => {
  const { cartId } = req.params;
  const userId = req.userId;

  const item = await Cart.findById(cartId);
  if (!item) {
    throw ApiError.notFound('Cart item not found');
  }

  if (item.createdBy && item.createdBy.toString() !== userId.toString()) {
    throw ApiError.forbidden('You cannot delete items from another user cart');
  }

  await Cart.findByIdAndDelete(cartId);
  return ApiResponse.success(res, null, 'Item removed from cart');
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    throw ApiError.unauthorized('User authentication required');
  }

  await Cart.deleteMany({ createdBy: userId });
  return ApiResponse.success(res, null, 'Cart cleared successfully');
});

module.exports = {
  getCart,
  addToCart,
  deleteCartItem,
  clearCart,
};
