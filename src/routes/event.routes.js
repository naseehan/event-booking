const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/getEvent', eventController.getEvents);
router.get('/searchedEvents', eventController.getSearchedEvents);
router.get('/getEachEvent', authenticate, eventController.getEachEvent);
router.post('/createEvent', authenticate, eventController.createEvent);
router.delete('/events/:eventId', authenticate, eventController.deleteEvent);

module.exports = router;
