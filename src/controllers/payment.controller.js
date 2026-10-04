const config = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

let stripe = null;
if (config.stripeSecret) {
  stripe = require('stripe')(config.stripeSecret);
}

const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw ApiError.internal('Payment gateway is not configured.');
  }

  const { products } = req.body;
  if (!products || !Array.isArray(products) || products.length === 0) {
    throw ApiError.badRequest('Cart is empty. Please add items before checking out.');
  }

  const lineItems = products.map((product) => {
    const unitPrice = Math.round((Number(product.price) || 0) * 100);
    return {
      price_data: {
        currency: 'inr',
        product_data: {
          name: product.name || 'Event Ticket',
          images: product.image ? [product.image] : [],
        },
        unit_amount: Math.max(100, unitPrice), // Minimum 100 paise (1 INR)
      },
      quantity: product.quantity || 1,
    };
  });

  const clientUrl = config.clientUrl || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/cancel`,
  });

  return res.status(200).json({ id: session.id, url: session.url });
});

module.exports = { createCheckoutSession };
