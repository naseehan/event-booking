const Event = require('../models/Event');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { isDbConnected } = require('../config/db');

const getEvents = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    throw ApiError.serviceUnavailable('Database connection is temporarily unavailable. Please retry in a few seconds.');
  }

  const limit = Math.max(1, parseInt(req.query.limit, 10) || 6);
  const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
  const { category, search, sortBy } = req.query;

  const query = {};
  if (category && category.trim()) {
    query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
  }
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { place: { $regex: search.trim(), $options: 'i' } },
      { venue: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === 'price_asc' || sortBy === 'sortByPrice') {
    sortOption = { price: 1 };
  } else if (sortBy === 'price_desc') {
    sortOption = { price: -1 };
  }

  const [getEvents, allEvents] = await Promise.all([
    Event.find(query).sort(sortOption).limit(limit).skip(skip).lean(),
    Event.countDocuments(query),
  ]);

  // Provide both legacy and modern structure for seamless compatibility
  return res.status(200).json({
    success: true,
    getEvents,
    allEvents,
    events: getEvents,
    totalEvents: allEvents,
    page: Math.floor(skip / limit) + 1,
    totalPages: Math.ceil(allEvents / limit),
    limit,
  });
});

const getSearchedEvents = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    throw ApiError.serviceUnavailable('Database connection is temporarily unavailable.');
  }

  const { category, query: searchQuery } = req.query;
  const filter = {};

  if (category) {
    filter.category = { $regex: category.trim(), $options: 'i' };
  }
  if (searchQuery) {
    filter.$or = [
      { name: { $regex: searchQuery.trim(), $options: 'i' } },
      { place: { $regex: searchQuery.trim(), $options: 'i' } },
    ];
  }

  const foundCategory = await Event.find(filter).lean();
  return res.status(200).json(foundCategory);
});

const getEachEvent = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    throw ApiError.serviceUnavailable('Database connection is temporarily unavailable.');
  }

  const userId = req.userId;
  if (!userId) {
    throw ApiError.unauthorized('User identity not provided');
  }

  const userEvents = await Event.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();
  return res.status(200).json(userEvents);
});

const createEvent = asyncHandler(async (req, res) => {
  const { name, category, place, price, date, time, venue, description, image } = req.body;
  const userId = req.userId;

  if (!name || !category || !place || price === undefined || !date || !time || !venue) {
    throw ApiError.badRequest('Please fill in all required event fields');
  }

  let formattedDate = date;
  try {
    const newDate = new Date(date);
    if (!isNaN(newDate.getTime())) {
      formattedDate = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long' }).format(newDate);
    }
  } catch (err) {
    // Keep original string if date parse fails
  }

  const newEvent = await Event.create({
    name: name.trim(),
    category: category.trim(),
    place: place.trim(),
    price: Number(price),
    date: formattedDate,
    time: time.trim(),
    venue: venue.trim(),
    description: description ? description.trim() : '',
    image: image || '',
    createdBy: userId,
  });

  return ApiResponse.created(res, newEvent, 'Event created successfully');
});

const deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.userId;

  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  // Check creator ownership (if user is authenticated)
  if (event.createdBy && event.createdBy.toString() !== userId.toString()) {
    throw ApiError.forbidden('You are not authorized to delete this event');
  }

  await Event.findByIdAndDelete(eventId);
  return ApiResponse.success(res, null, 'Event deleted successfully');
});

module.exports = {
  getEvents,
  getSearchedEvents,
  getEachEvent,
  createEvent,
  deleteEvent,
};
