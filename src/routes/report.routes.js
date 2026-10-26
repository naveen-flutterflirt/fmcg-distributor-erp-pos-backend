const express = require('express');
const router = express.Router();
const { getExecutiveKPIs, downloadReport } = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/kpis', getExecutiveKPIs);
router.get('/download', downloadReport);

module.exports = router;
