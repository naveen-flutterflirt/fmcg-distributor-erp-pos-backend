const db = require('../config/db');

class CollectionModel {
  static async getLedger({ search, route, status, overdueOnly, userId } = {}) {
    let sql = `
      SELECT 
        o.id, 
        o.name, 
        o.owner_name as "ownerName", 
        o.route, 
        o.beat_id as "beatId",
        o.channel, 
        o.gstin, 
        o.phone, 
        o.credit_limit::float as "creditLimit",
        o.credit_days as "creditDays", 
        o.current_balance::float as "currentBalance",
        o.overdue_days as "overdueDays", 
        o.status,
        b.name as "beatName"
      FROM outlets o
      LEFT JOIN beats b ON o.beat_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(userId);
      sql += ` AND o.user_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (o.name ILIKE $${params.length} OR o.owner_name ILIKE $${params.length} OR o.phone ILIKE $${params.length} OR o.route ILIKE $${params.length})`;
    }

    if (route && route !== 'All') {
      params.push(route);
      sql += ` AND o.route = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    if (overdueOnly === 'true' || overdueOnly === true) {
      sql += ` AND o.overdue_days > 0`;
    }

    sql += ' ORDER BY o.overdue_days DESC, o.current_balance DESC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async getStats(userId) {
    let sql = `
      SELECT 
        COALESCE(SUM(current_balance), 0)::float as "totalOutstanding",
        COALESCE(SUM(current_balance) FILTER (WHERE overdue_days > 21), 0)::float as "overdue21Days",
        COUNT(*) as "totalOutlets",
        COUNT(*) FILTER (WHERE current_balance > 0) as "billedRetailers",
        COALESCE(ROUND(AVG(overdue_days)), 0)::int as "avgOverdueDays"
      FROM outlets
      WHERE 1=1
    `;
    const params = [];
    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $1`;
    }
    const res = await db.query(sql, params);
    const r = res.rows[0] || {};
    const totalOut = parseFloat(r.totalOutstanding) || 0;
    return {
      totalOutstanding: totalOut,
      dsoDays: totalOut > 0 ? 11 : 0,
      overdue21Days: parseFloat(r.overdue21Days) || 0,
      totalOutlets: parseInt(r.totalOutlets || 0, 10),
      billedRetailers: parseInt(r.billedRetailers || 0, 10),
    };
  }

  static async recordReceipt(receiptData) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      let {
        id = `REC-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(100 + Math.random() * 900)}`,
        outletId,
        outletName,
        amount,
        paymentMode = 'Cash',
        referenceNo = null,
        collectionDate = 'Today',
        salesmanName = 'Counter / Cash Desk',
        notes = null,
        status = 'Cleared',
        userId
      } = receiptData;

      if (!outletName && outletId) {
        const outletLookup = await client.query('SELECT name FROM outlets WHERE id = $1', [outletId]);
        if (outletLookup.rows.length > 0) {
          outletName = outletLookup.rows[0].name;
        } else {
          outletName = 'Retail Outlet';
        }
      }

      const numAmount = parseFloat(amount || 0);

      // 1. Insert into collections table
      const insertSql = `
        INSERT INTO collections 
        (id, outlet_id, outlet_name, amount, payment_mode, reference_no, collection_date, salesman_name, notes, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const collResult = await client.query(insertSql, [
        id,
        outletId,
        outletName,
        numAmount,
        paymentMode,
        referenceNo,
        collectionDate,
        salesmanName,
        notes,
        status,
      ]);

      // 2. Reduce the outlet's current_balance in outlets table
      // If balance becomes <= 0 or <= creditLimit, clear credit_hold
      const updateOutletSql = `
        UPDATE outlets
        SET current_balance = GREATEST(0, current_balance - $1),
            overdue_days = CASE WHEN current_balance - $1 <= 0 THEN 0 ELSE overdue_days END,
            status = CASE WHEN current_balance - $1 <= credit_limit THEN 'active' ELSE status END
        WHERE id = $2
        RETURNING *
      `;
      const outletResult = await client.query(updateOutletSql, [numAmount, outletId]);

      await client.query('COMMIT');

      return {
        receipt: collResult.rows[0],
        updatedOutlet: outletResult.rows[0],
        message: `₹${numAmount.toLocaleString()} credited to ${outletName}. Ledger balance updated.`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getReceiptsHistory({ outletId } = {}) {
    let sql = `
      SELECT 
        id, 
        outlet_id as "outletId", 
        outlet_name as "outletName", 
        amount::float, 
        payment_mode as "paymentMode", 
        reference_no as "referenceNo", 
        collection_date as "collectionDate", 
        salesman_name as "salesmanName", 
        notes, 
        status, 
        created_at as "createdAt"
      FROM collections
      WHERE 1=1
    `;
    const params = [];
    if (outletId) {
      params.push(outletId);
      sql += ` AND outlet_id = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const result = await db.query(sql, params);
    return result.rows;
  }
}

module.exports = CollectionModel;
