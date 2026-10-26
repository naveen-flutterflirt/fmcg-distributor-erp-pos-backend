const db = require('../config/db');

class OrderModel {
  static async findAll({ status, route, search, userId } = {}) {
    let sql = `
      SELECT 
        o.id, o.outlet_id as "outletId", o.outlet_name as "outletName",
        o.route, o.source, o.salesman_name as "salesmanName",
        o.order_date as "date", o.delivery_date as "deliveryDate",
        o.lines_count as "linesCount", o.total_value::float as "totalValue",
        o.scheme_total::float as "schemeTotal", o.status,
        o.check_status as "checkStatus",
        COALESCE(
          json_agg(
            json_build_object(
              'skuId', l.sku_id,
              'skuName', l.sku_name,
              'qtyCases', l.qty_cases,
              'qtyPcs', l.qty_pcs,
              'rate', l.rate::float,
              'schemeDesc', l.scheme_desc,
              'schemeDiscount', l.scheme_discount::float,
              'amount', l.amount::float,
              'freeGoodsDesc', l.free_goods_desc
            )
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'
        ) as lines
      FROM sales_orders o
      LEFT JOIN sales_order_lines l ON o.id = l.order_id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(userId);
      sql += ` AND o.user_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    if (route) {
      params.push(route);
      sql += ` AND o.route = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (o.id ILIKE $${params.length} OR o.outlet_name ILIKE $${params.length})`;
    }

    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const sql = `
      SELECT 
        o.id, o.outlet_id as "outletId", o.outlet_name as "outletName",
        o.route, o.source, o.salesman_name as "salesmanName",
        o.order_date as "date", o.delivery_date as "deliveryDate",
        o.lines_count as "linesCount", o.total_value::float as "totalValue",
        o.scheme_total::float as "schemeTotal", o.status,
        o.check_status as "checkStatus",
        COALESCE(
          json_agg(
            json_build_object(
              'skuId', l.sku_id,
              'skuName', l.sku_name,
              'qtyCases', l.qty_cases,
              'qtyPcs', l.qty_pcs,
              'rate', l.rate::float,
              'schemeDesc', l.scheme_desc,
              'schemeDiscount', l.scheme_discount::float,
              'amount', l.amount::float,
              'freeGoodsDesc', l.free_goods_desc
            )
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'
        ) as lines
      FROM sales_orders o
      LEFT JOIN sales_order_lines l ON o.id = l.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  static async createOrderWithTransaction(orderData) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const {
        id,
        userId = null,
        outletId,
        outletName,
        route,
        source = 'Salesman',
        salesmanName = null,
        date,
        deliveryDate,
        linesCount,
        totalValue,
        schemeTotal = 0,
        status = 'Pending',
        checkStatus = 'OK',
        lines = []
      } = orderData;

      // 1. Insert Sales Order
      const insertOrderSql = `
        INSERT INTO sales_orders 
        (id, user_id, outlet_id, outlet_name, route, source, salesman_name, order_date, delivery_date, lines_count, total_value, scheme_total, status, check_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      await client.query(insertOrderSql, [
        id,
        userId,
        outletId,
        outletName,
        route,
        source,
        salesmanName,
        date,
        deliveryDate,
        linesCount || lines.length,
        totalValue,
        schemeTotal,
        status,
        checkStatus,
      ]);

      // 2. Insert Lines & adjust stock
      for (const line of lines) {
        const skuId = line.skuId || line.sku_id;
        const skuName = line.skuName || line.sku_name || 'SKU Item';
        const qtyCases = line.qtyCases !== undefined ? line.qtyCases : (line.qty_cases || 0);
        const qtyPcs = line.qtyPcs !== undefined ? line.qtyPcs : (line.qty_pcs || 0);
        const rate = line.rate !== undefined ? line.rate : 0;
        const schemeDesc = line.schemeDesc || line.scheme_desc || null;
        const schemeDiscount = line.schemeDiscount !== undefined ? line.schemeDiscount : (line.scheme_discount || 0);
        const amount = line.amount !== undefined ? line.amount : 0;
        const freeGoodsDesc = line.freeGoodsDesc || line.free_goods_desc || null;

        const insertLineSql = `
          INSERT INTO sales_order_lines 
          (order_id, sku_id, sku_name, qty_cases, qty_pcs, rate, scheme_desc, scheme_discount, amount, free_goods_desc)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        await client.query(insertLineSql, [
          id,
          skuId,
          skuName,
          qtyCases,
          qtyPcs,
          rate,
          schemeDesc,
          schemeDiscount,
          amount,
          freeGoodsDesc,
        ]);
      }

      // 3. Update Outlet's current_balance so Collections Ledger reflects billed dues
      const numTotal = parseFloat(totalValue || 0);
      if (numTotal > 0 && outletId) {
        await client.query(`
          UPDATE outlets 
          SET current_balance = current_balance + $1,
              status = CASE WHEN current_balance + $1 > credit_limit THEN 'credit_hold' ELSE status END
          WHERE id = $2
        `, [numTotal, outletId]);
      }

      await client.query('COMMIT');
      return { id, message: 'Order created successfully' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = OrderModel;
