const db = require('../config/db');

class SchemeModel {
  static async findAll({ search, companyId, fundedBy, status, userId } = {}) {
    let sql = `
      SELECT 
        id, 
        name, 
        company_id as "companyId", 
        company_name as "company", 
        category, 
        condition_desc as "condition", 
        benefit_desc as "benefit", 
        funded_by as "fundedBy",
        budget_used::float as "budgetUsedVal",
        budget_total::float as "budgetTotalVal",
        CONCAT('₹', TO_CHAR(budget_used, 'FM99,99,999'), ' / ₹', TO_CHAR(budget_total, 'FM99,99,999')) as "budgetUsed",
        status, 
        created_at as "createdAt"
      FROM schemes
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR company_name ILIKE $${params.length} OR category ILIKE $${params.length})`;
    }

    if (companyId && companyId !== 'All' && companyId !== 'all') {
      params.push(companyId);
      sql += ` AND company_id = $${params.length}`;
    }

    if (fundedBy && fundedBy !== 'All') {
      params.push(fundedBy);
      sql += ` AND funded_by = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async createScheme(schemeData) {
    const {
      id = `SCH-${Date.now().toString(36).toUpperCase()}`,
      userId = null,
      name,
      companyId,
      companyName,
      category = 'General FMCG',
      condition,
      benefit,
      fundedBy = 'Company-funded',
      budgetTotal = 50000,
      budgetUsed = 0,
      status = 'Active'
    } = schemeData;

    const sql = `
      INSERT INTO schemes 
      (id, user_id, name, company_id, company_name, category, condition_desc, benefit_desc, funded_by, budget_total, budget_used, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING 
        id, name, company_id as "companyId", company_name as "company", category,
        condition_desc as "condition", benefit_desc as "benefit", funded_by as "fundedBy",
        budget_used::float as "budgetUsedVal", budget_total::float as "budgetTotalVal",
        status, created_at as "createdAt"
    `;

    const result = await db.query(sql, [
      id, userId, name, companyId, companyName, category, condition, benefit, fundedBy, budgetTotal, budgetUsed, status
    ]);
    return result.rows[0];
  }

  static async getStats(userId) {
    let sql = `
      SELECT 
        COUNT(*) as "totalActive",
        COUNT(*) FILTER (WHERE funded_by = 'Company-funded') as "companyFunded",
        COUNT(*) FILTER (WHERE funded_by = 'Distributor-funded') as "distributorFunded"
      FROM schemes
      WHERE status = 'Active'
    `;
    const params = [];
    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $1`;
    }
    const res = await db.query(sql, params);
    return {
      totalActive: parseInt(res.rows[0]?.totalActive || 0, 10),
      companyFunded: parseInt(res.rows[0]?.companyFunded || 0, 10),
      distributorFunded: parseInt(res.rows[0]?.distributorFunded || 0, 10),
    };
  }
}

module.exports = SchemeModel;
