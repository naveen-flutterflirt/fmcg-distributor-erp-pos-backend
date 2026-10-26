const pool = require('../config/db');

class FieldTeamModel {
  /**
   * Get all salesmen with real-time order bookings & live performance
   */
  static async getAllSalesmen(userId) {
    // 1. Fetch salesmen
    let smQuery = `
      SELECT 
        s.id,
        s.name,
        s.phone,
        s.beat_name,
        s.planned_calls,
        s.visited_calls,
        s.productive_calls,
        s.lpc,
        s.target_sales,
        s.today_sales,
        s.must_sell_completed,
        s.must_sell_total,
        s.incentive_rate,
        s.status,
        s.created_at
      FROM salesmen s
      WHERE 1=1
    `;
    const smParams = [];
    if (userId) {
      smParams.push(userId);
      smQuery += ` AND s.user_id = $${smParams.length}`;
    }
    smQuery += ` ORDER BY s.today_sales DESC, s.name ASC`;
    const salesmenRes = await pool.query(smQuery, smParams);

    // 2. Aggregate dynamic sales booked by salesman from sales_orders
    let ordersQuery = `
      SELECT 
        salesman_name,
        COALESCE(SUM(total_value), 0) AS total_booked,
        COUNT(id) AS total_orders
      FROM sales_orders
      WHERE salesman_name IS NOT NULL AND LOWER(status) != 'cancelled'
    `;
    const ordersParams = [];
    if (userId) {
      ordersParams.push(userId);
      ordersQuery += ` AND user_id = $${ordersParams.length}`;
    }
    ordersQuery += ` GROUP BY salesman_name`;
    const ordersRes = await pool.query(ordersQuery, ordersParams);

    const orderStatsMap = {};
    ordersRes.rows.forEach(r => {
      orderStatsMap[r.salesman_name.toLowerCase()] = {
        booked: parseFloat(r.total_booked) || 0,
        ordersCount: parseInt(r.total_orders, 10) || 0
      };
    });

    const salesmen = salesmenRes.rows.map(sm => {
      // Find matching live orders
      const firstName = sm.name.split(' ')[0].toLowerCase();
      const liveBooking = orderStatsMap[firstName] || orderStatsMap[sm.name.toLowerCase()] || { booked: 0, ordersCount: 0 };
      
      const combinedTodaySales = parseFloat(sm.today_sales) + liveBooking.booked;
      const combinedProductive = parseInt(sm.productive_calls, 10) + liveBooking.ordersCount;
      const planned = parseInt(sm.planned_calls, 10) || 30;
      const incentiveRate = parseFloat(sm.incentive_rate) || 0.048;
      const earnedIncentive = Math.round(combinedTodaySales * incentiveRate);

      return {
        id: sm.id,
        name: sm.name,
        phone: sm.phone,
        beat: sm.beat_name,
        planned,
        visited: parseInt(sm.visited_calls, 10),
        productive: combinedProductive,
        productivityPercent: Math.min(100, Math.round((combinedProductive / planned) * 100)),
        lpc: parseFloat(sm.lpc),
        targetSales: parseFloat(sm.target_sales),
        sales: combinedTodaySales,
        mustSellCompleted: parseInt(sm.must_sell_completed, 10),
        mustSellTotal: parseInt(sm.must_sell_total, 10),
        earnedIncentive,
        status: sm.status
      };
    });

    // 3. Stats summary
    const totalSalesmen = salesmen.length;
    const activeSalesmen = salesmen.filter(s => s.status === 'On Beat').length;
    const totalBookedSales = salesmen.reduce((acc, s) => acc + s.sales, 0);
    const totalEarnedIncentive = salesmen.reduce((acc, s) => acc + s.earnedIncentive, 0);

    return {
      stats: {
        totalSalesmen,
        activeSalesmen,
        totalBookedSales,
        totalEarnedIncentive,
        avgProductivity: totalSalesmen > 0 ? Math.round(salesmen.reduce((a, b) => a + b.productivityPercent, 0) / totalSalesmen) : 0
      },
      salesmen
    };
  }

  /**
   * Add a new salesman / field rep
   */
  static async createSalesman(data) {
    const {
      name,
      phone,
      beat_name,
      planned_calls = 30,
      target_sales = 50000,
      must_sell_total = 5,
      userId = null
    } = data;

    const id = `SM-${Date.now().toString().slice(-4)}`;

    const res = await pool.query(
      `INSERT INTO salesmen (id, name, phone, beat_name, planned_calls, target_sales, must_sell_total, status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'On Beat', $8)
       RETURNING *`,
      [id, name, phone, beat_name, planned_calls, target_sales, must_sell_total, userId]
    );

    return res.rows[0];
  }

  /**
   * Record salesman visit / order call update
   */
  static async updateCallProgress(id, { productiveIncrement = 1, salesAmount = 0, mustSellIncrement = 0 }) {
    const res = await pool.query(
      `UPDATE salesmen 
       SET visited_calls = visited_calls + 1,
           productive_calls = productive_calls + $1,
           today_sales = today_sales + $2,
           must_sell_completed = LEAST(must_sell_total, must_sell_completed + $3)
       WHERE id = $4
       RETURNING *`,
      [productiveIncrement, salesAmount, mustSellIncrement, id]
    );
    return res.rows[0];
  }
}

module.exports = FieldTeamModel;
