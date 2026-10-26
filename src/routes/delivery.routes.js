const express = require('express');
const router = express.Router();
const { getAllTrips, dispatchOrdersToTrip, createTrip } = require('../controllers/delivery.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/trips', getAllTrips);
router.post('/dispatch', dispatchOrdersToTrip);
router.post('/trips', createTrip);

module.exports = router;
