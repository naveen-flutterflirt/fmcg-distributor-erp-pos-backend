const db = require('../config/db');

class ClaimModel {
  static async findAll({ search, companyId, status, userId } = {}) {
    let sql = `
      SELECT 
        c.id, 
        c.company_id as "companyId", 
        c.company, 
        c.claim_type as "type", 
        c.period, 
        c.amount::float, 
        c.age_days as "ageDays", 
        c.status, 
        c.query_note as "queryNote",
        json_build_object(
          'freeGoodsList', c.free_goods_list,
          'outletListGst', c.outlet_list_gst,
          'circularLinked', c.circular_linked,
          'formatGenerated', c.format_generated
        ) as evidence,
        c.created_at as "createdAt"
      FROM claims c
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(userId);
      sql += ` AND c.user_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (c.id ILIKE $${params.length} OR c.company ILIKE $${params.length} OR c.claim_type ILIKE $${params.length})`;
    }

    if (companyId && companyId !== 'All' && companyId !== 'all') {
      params.push(companyId);
      sql += ` AND c.company_id = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    }

    sql += ' ORDER BY c.age_days ASC, c.created_at DESC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const sql = `
      SELECT 
        c.id, c.company_id as "companyId", c.company, c.claim_type as "type", 
        c.period, c.amount::float, c.age_days as "ageDays", c.status, 
        c.query_note as "queryNote",
        json_build_object(
          'freeGoodsList', c.free_goods_list,
          'outletListGst', c.outlet_list_gst,
          'circularLinked', c.circular_linked,
          'formatGenerated', c.format_generated
        ) as evidence
      FROM claims c
      WHERE c.id = $1
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  static async createClaim(claimData) {
    const {
      id = `CL-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(100 + Math.random() * 900)}`,
      companyId,
      company,
      type,
      period = `${new Date().toLocaleString('en-US', { month: 'short' })} ${new Date().getFullYear()}`,
      amount,
      ageDays = 0,
      status = 'Submitted',
      queryNote = null,
      freeGoodsList = true,
      outletListGst = true,
      circularLinked = true,
      formatGenerated = true
    } = claimData;

    const sql = `
      INSERT INTO claims 
      (id, company_id, company, claim_type, period, amount, age_days, status, query_note, free_goods_list, outlet_list_gst, circular_linked, format_generated)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const result = await db.query(sql, [
      id, companyId, company, type, period, amount, ageDays, status, queryNote, freeGoodsList, outletListGst, circularLinked, formatGenerated
    ]);
    return result.rows[0];
  }

  static async replyQuery(id, replyText) {
    const sql = `
      UPDATE claims 
      SET status = 'Audit done',
          query_note = CONCAT(COALESCE(query_note, ''), ' | Responded: ', $1::text)
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(sql, [replyText, id]);
    return result.rows[0];
  }

  static async getStats(userId) {
    let sql = `
      SELECT 
        COALESCE(SUM(amount), 0)::float as "totalClaimsVal",
        COALESCE(SUM(amount) FILTER (WHERE status = 'Credit note recd.'), 0)::float as "settledVal",
        COALESCE(SUM(amount) FILTER (WHERE status != 'Credit note recd.'), 0)::float as "pendingVal",
        COUNT(DISTINCT company_id) as "companyCount"
      FROM claims
      WHERE 1=1
    `;
    const params = [];
    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $1`;
    }
    const res = await db.query(sql, params);
    const r = res.rows[0] || {};
    return {
      totalRaised: parseFloat(r.totalClaimsVal) || 0,
      settled: parseFloat(r.settledVal) || 0,
      pending: parseFloat(r.pendingVal) || 0,
      companiesCount: parseInt(r.companyCount || 0, 10),
    };
  }
}

module.exports = ClaimModel;
