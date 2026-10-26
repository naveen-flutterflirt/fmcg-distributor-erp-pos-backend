const express = require('express');
const router = express.Router();
const CollectionController = require('../controllers/collection.controller');

router.get('/', CollectionController.getLedger);
router.get('/ledger', CollectionController.getLedger);
router.get('/stats', CollectionController.getStats);
router.get('/history', CollectionController.getReceiptsHistory);
router.post('/receipt', CollectionController.recordReceipt);

module.exports = router;
