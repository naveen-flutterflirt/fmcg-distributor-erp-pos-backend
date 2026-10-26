const pool = require('../config/db');

class DeliveryModel {
  /**
   * Get all active delivery trips with load progress
   */
  static async getAllTrips(userId) {
    let sql = `
      SELECT 
        id,
        vehicle,
        driver,
        route,
        drops_total AS "dropsTotal",
        drops_completed AS "dropsCompleted",
        total_value::float AS value,
        cash_collected::float AS collected,
        status,
        orders_list AS "ordersList",
        created_at AS "createdAt"
      FROM delivery_trips
      WHERE 1=1
    `;
    const params = [];
    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $${params.length}`;
    }
    sql += ` ORDER BY created_at DESC`;
    const res = await pool.query(sql, params);
    return res.rows;
  }

  /**
   * Dispatch & add billed orders into a delivery trip load-sheet
   */
  static async addOrdersToTrip({ route, orderIds = [], vehicle = 'Tata Ace · DL 1L AA 2210', driver = 'Manoj Kumar' }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch orders details
      const ordersRes = await client.query(
        `SELECT id, outlet_name, total_value, route 
         FROM sales_orders 
         WHERE id = ANY($1)`,
        [orderIds]
      );

      const billedOrders = ordersRes.rows;
      const additionalValue = billedOrders.reduce((sum, o) => sum + parseFloat(o.total_value || 0), 0);
      const additionalDrops = billedOrders.length;

      // 2. Mark orders status as 'Billed & Dispatched' in sales_orders
      await client.query(
        `UPDATE sales_orders 
         SET status = 'Billed', check_status = 'Billed'
         WHERE id = ANY($1)`,
        [orderIds]
      );

      // 3. Find active trip for this route or create a new load trip
      const existingTripRes = await client.query(
        `SELECT id, drops_total, total_value, orders_list 
         FROM delivery_trips 
         WHERE route ILIKE $1 AND status != 'Settled & Completed'
         LIMIT 1`,
        [`%${route}%`]
      );

      let trip;
      if (existingTripRes.rows.length > 0) {
        const t = existingTripRes.rows[0];
        const updatedList = [...(t.orders_list || []), ...billedOrders];
        const updateRes = await client.query(
          `UPDATE delivery_trips 
           SET drops_total = drops_total + $1,
               total_value = total_value + $2,
               orders_list = $3
           WHERE id = $4
           RETURNING *`,
          [additionalDrops, additionalValue, JSON.stringify(updatedList), t.id]
        );
        trip = updateRes.rows[0];
      } else {
        const tripId = `TRIP-${Date.now().toString().slice(-4)}`;
        const insertRes = await client.query(
          `INSERT INTO delivery_trips (id, vehicle, driver, route, drops_total, drops_completed, total_value, cash_collected, status, orders_list)
           VALUES ($1, $2, $3, $4, $5, 0, $6, 0, 'In Transit', $7)
           RETURNING *`,
          [tripId, vehicle, driver, route, additionalDrops, additionalValue, JSON.stringify(billedOrders)]
        );
        trip = insertRes.rows[0];
      }

      await client.query('COMMIT');
      return trip;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Plan a new delivery dispatch trip
   */
  static async createTrip(data) {
    const {
      vehicle,
      driver,
      route,
      drops_total = 20,
      total_value = 100000
    } = data;

    const id = `TRIP-${Date.now().toString().slice(-4)}`;
    const res = await pool.query(
      `INSERT INTO delivery_trips (id, vehicle, driver, route, drops_total, drops_completed, total_value, cash_collected, status)
       VALUES ($1, $2, $3, $4, $5, 0, $6, 0, 'In Transit')
       RETURNING *`,
      [id, vehicle, driver, route, drops_total, total_value]
    );
    return res.rows[0];
  }
}

module.exports = DeliveryModel;
