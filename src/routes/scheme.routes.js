const express = require('express');
const router = express.Router();
const SchemeController = require('../controllers/scheme.controller');

router.get('/', SchemeController.getSchemes);
router.get('/stats', SchemeController.getStats);
router.post('/', SchemeController.createScheme);

module.exports = router;
