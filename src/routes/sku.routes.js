const express = require('express');
const router = express.Router();
const SkuController = require('../controllers/sku.controller');

router.get('/', SkuController.getSkus);
router.get('/:id', SkuController.getSkuById);

module.exports = router;
