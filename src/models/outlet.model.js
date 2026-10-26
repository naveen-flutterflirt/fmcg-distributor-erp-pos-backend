const db = require('../config/db');

class OutletModel {
  static async findAll({ search, route, status, channel, userId } = {}) {
    let sql = `
      SELECT 
        o.id, o.name, o.owner_name as "ownerName", o.route, o.beat_id as "beatId",
        o.channel, o.gstin, o.phone, o.credit_limit::float as "creditLimit",
        o.credit_days as "creditDays", o.current_balance::float as "currentBalance",
        o.overdue_days as "overdueDays", o.status,
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
      sql += ` AND (o.name ILIKE $${params.length} OR o.owner_name ILIKE $${params.length} OR o.phone ILIKE $${params.length})`;
    }

    if (route) {
      params.push(route);
      sql += ` AND o.route = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    if (channel) {
      params.push(channel);
      sql += ` AND o.channel = $${params.length}`;
    }

    sql += ' ORDER BY o.name ASC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const sql = `
      SELECT 
        o.id, o.name, o.owner_name as "ownerName", o.route, o.beat_id as "beatId",
        o.channel, o.gstin, o.phone, o.credit_limit::float as "creditLimit",
        o.credit_days as "creditDays", o.current_balance::float as "currentBalance",
        o.overdue_days as "overdueDays", o.status,
        b.name as "beatName"
      FROM outlets o
      LEFT JOIN beats b ON o.beat_id = b.id
      WHERE o.id = $1
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  static async createOutlet(data) {
    const {
      name,
      ownerName,
      route,
      beatId = null,
      channel = 'General Trade',
      gstin = null,
      phone,
      creditLimit = 25000,
      creditDays = 14,
      currentBalance = 0,
      status = 'active',
      userId = null
    } = data;

    const id = `out-${Date.now().toString().slice(-4)}`;

    const sql = `
      INSERT INTO outlets (
        id, name, owner_name, route, beat_id, channel, gstin, phone, credit_limit, credit_days, current_balance, overdue_days, status, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12, $13)
      RETURNING 
        id, name, owner_name as "ownerName", route, beat_id as "beatId",
        channel, gstin, phone, credit_limit::float as "creditLimit",
        credit_days as "creditDays", current_balance::float as "currentBalance",
        overdue_days as "overdueDays", status
    `;

    const result = await db.query(sql, [
      id, name, ownerName, route, beatId, channel, gstin, phone, creditLimit, creditDays, currentBalance, status, userId
    ]);
    return result.rows[0];
  }

  static async updateBalance(id, newBalance, client = db) {
    const sql = `
      UPDATE outlets 
      SET current_balance = $1
      WHERE id = $2 
      RETURNING *
    `;
    const result = await client.query(sql, [newBalance, id]);
    return result.rows[0];
  }
}

module.exports = OutletModel;
