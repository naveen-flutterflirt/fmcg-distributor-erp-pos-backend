const express = require('express');
const router = express.Router();
const OutletController = require('../controllers/outlet.controller');

router.get('/', OutletController.getOutlets);
router.post('/', OutletController.createOutlet);
router.get('/:id', OutletController.getOutletById);

module.exports = router;
