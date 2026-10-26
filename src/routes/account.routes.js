const express = require('express');
const router = express.Router();
const {
  getOverview,
  getPnL,
  getBankRecon,
  downloadTallyXml,
  lockPeriod
} = require('../controllers/account.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/overview', getOverview);
router.get('/pnl', getPnL);
router.get('/bank-recon', getBankRecon);
router.get('/tally-xml', downloadTallyXml);
router.post('/lock-period', lockPeriod);

module.exports = router;
