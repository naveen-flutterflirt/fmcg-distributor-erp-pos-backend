const express = require('express');
const router = express.Router();
const { getActiveTrip, settleTrip } = require('../controllers/van.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/trip', getActiveTrip);
router.post('/trip/:id/settle', settleTrip);

module.exports = router;
