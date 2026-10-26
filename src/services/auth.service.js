const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

class AuthService {
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return jwt.sign(payload, process.env.JWT_SECRET || 'fmcg_fallback_secret_key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  static async login({ email, password }) {
    if (!email || !password) {
      throw { status: 400, message: 'Please provide email and password' };
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    if (user.status !== 'active') {
      throw { status: 403, message: 'Account is deactivated' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  static async register({ name, email, password, role, phone }) {
    if (!name || !email || !password) {
      throw { status: 400, message: 'Name, email and password are required' };
    }

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      throw { status: 400, message: 'User already exists with this email' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = `usr-${Date.now().toString(36)}`;

    const newUser = await UserModel.createUser({
      id,
      name,
      email,
      passwordHash,
      role: role || 'distributor_owner',
      phone,
    });

    const token = this.generateToken(newUser);

    return {
      token,
      user: newUser,
    };
  }
}

module.exports = AuthService;
