const express = require('express');
const router = express.Router();
const GodownController = require('../controllers/godown.controller');

router.get('/inventory', GodownController.getInventory);
router.get('/stats', GodownController.getStats);
router.post('/batches', GodownController.addBatch);
router.post('/inward-scan', GodownController.inwardScan);

module.exports = router;
