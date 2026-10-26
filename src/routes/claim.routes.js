const express = require('express');
const router = express.Router();
const ClaimController = require('../controllers/claim.controller');

router.get('/', ClaimController.getClaims);
router.get('/stats', ClaimController.getStats);
router.get('/:id', ClaimController.getClaimById);
router.post('/', ClaimController.raiseClaim);
router.post('/:id/reply', ClaimController.replyQuery);

module.exports = router;
