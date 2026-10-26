const AuthService = require('../services/auth.service');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login({ email, password });
      res.json({
        success: true,
        message: 'Login successful',
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async register(req, res, next) {
    try {
      const { name, email, password, role, phone } = req.body;
      const data = await AuthService.register({ name, email, password, role, phone });
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req, res) {
    res.json({
      success: true,
      data: req.user,
    });
  }
}

module.exports = AuthController;
