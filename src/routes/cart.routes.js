const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/getCart', authenticate, cartController.getCart);
router.post('/cart', authenticate, cartController.addToCart);
router.delete('/deleteCart/:cartId', authenticate, cartController.deleteCartItem);
router.delete('/clearCart', authenticate, cartController.clearCart);

module.exports = router;
