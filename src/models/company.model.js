const db = require('../config/db');

class CompanyModel {
  static async findAll() {
    const sql = `
      SELECT 
        id, 
        name, 
        category,
        created_at as "createdAt"
      FROM companies
      ORDER BY name ASC
    `;
    const result = await db.query(sql);
    return result.rows;
  }

  static async findById(id) {
    const sql = `
      SELECT id, name, category, created_at as "createdAt"
      FROM companies
      WHERE id = $1
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  static async createCompany({ id, name, category }) {
    const sql = `
      INSERT INTO companies (id, name, category)
      VALUES ($1, $2, $3)
      RETURNING id, name, category, created_at as "createdAt"
    `;
    const result = await db.query(sql, [id, name, category]);
    return result.rows[0];
  }
}

module.exports = CompanyModel;
