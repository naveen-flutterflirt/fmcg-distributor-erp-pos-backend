const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', protect, AuthController.getProfile);

module.exports = router;
