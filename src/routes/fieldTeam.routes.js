const express = require('express');
const router = express.Router();
const {
  getAllSalesmen,
  createSalesman,
  updateCallProgress
} = require('../controllers/fieldTeam.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/salesmen', getAllSalesmen);
router.post('/salesmen', createSalesman);
router.patch('/salesmen/:id/progress', updateCallProgress);

module.exports = router;
