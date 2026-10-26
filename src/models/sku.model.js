const db = require('../config/db');

class SkuModel {
  static async findAll({ search, companyId, mustSell } = {}) {
    let sql = `
      SELECT 
        id, name, code, barcode, company_id as "companyId", company_name as "company",
        brand, mrp::float, rate::float, uom, units_per_case as "unitsPerCase",
        gst_percent::float as "gstPercent", stock_cases as "stockCases",
        stock_pcs as "stockPcs", must_sell as "mustSell"
      FROM skus
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR barcode ILIKE $${params.length})`;
    }

    if (companyId && companyId !== 'all') {
      params.push(companyId);
      sql += ` AND company_id = $${params.length}`;
    }

    if (mustSell !== undefined) {
      params.push(mustSell);
      sql += ` AND must_sell = $${params.length}`;
    }

    sql += ' ORDER BY name ASC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const sql = `
      SELECT 
        id, name, code, barcode, company_id as "companyId", company_name as "company",
        brand, mrp::float, rate::float, uom, units_per_case as "unitsPerCase",
        gst_percent::float as "gstPercent", stock_cases as "stockCases",
        stock_pcs as "stockPcs", must_sell as "mustSell"
      FROM skus
      WHERE id = $1
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  static async updateStock(id, { stockCases, stockPcs }, client = db) {
    const sql = `
      UPDATE skus 
      SET stock_cases = $1, stock_pcs = $2 
      WHERE id = $3 
      RETURNING *
    `;
    const result = await client.query(sql, [stockCases, stockPcs, id]);
    return result.rows[0];
  }
}

module.exports = SkuModel;
