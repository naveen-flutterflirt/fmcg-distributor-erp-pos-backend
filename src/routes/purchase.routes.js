const express = require('express');
const router = express.Router();
const PurchaseController = require('../controllers/purchase.controller');

router.get('/', PurchaseController.getPurchaseOrders);
router.get('/:id', PurchaseController.getPOById);
router.post('/', PurchaseController.createPO);
router.post('/:id/grn', PurchaseController.receiveGRN);

module.exports = router;
