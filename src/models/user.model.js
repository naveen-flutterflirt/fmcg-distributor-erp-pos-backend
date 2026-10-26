const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const sql = `
      SELECT 
        id, name, email, password_hash as "passwordHash",
        role, phone, status, created_at as "createdAt"
      FROM users
      WHERE email = $1
    `;
    const result = await db.query(sql, [email.toLowerCase().trim()]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT 
        id, name, email, role, phone, status, created_at as "createdAt"
      FROM users
      WHERE id = $1
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  static async createUser({ id, name, email, passwordHash, role = 'distributor_owner', phone = null }) {
    const sql = `
      INSERT INTO users (id, name, email, password_hash, role, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role, phone, status, created_at as "createdAt"
    `;
    const result = await db.query(sql, [
      id,
      name,
      email.toLowerCase().trim(),
      passwordHash,
      role,
      phone,
    ]);
    return result.rows[0];
  }
}

module.exports = UserModel;
