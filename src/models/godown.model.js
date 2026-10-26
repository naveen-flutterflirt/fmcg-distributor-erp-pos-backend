const db = require('../config/db');

class GodownModel {
  static async getInventoryLedger({ search, companyId, status, mustSell, userId } = {}) {
    let sql = `
      SELECT 
        s.id, s.name, s.code, s.barcode, s.company_name as "company",
        s.brand, s.mrp::float, s.rate::float, s.uom, s.units_per_case as "unitsPerCase",
        s.gst_percent::float as "gstPercent",
        COALESCE(SUM(b.cases_available), 0)::int as "stockCases",
        COALESCE(SUM(b.pcs_available), 0)::int as "stockPcs",
        s.must_sell as "mustSell",
        COALESCE(
          json_agg(
            json_build_object(
              'id', b.id,
              'batchNumber', b.batch_number,
              'mfgDate', b.mfg_date,
              'expiryDate', b.expiry_date,
              'daysToExpiry', b.days_to_expiry,
              'casesAvailable', b.cases_available,
              'pcsAvailable', b.pcs_available,
              'location', b.location,
              'status', b.status
            )
          ) FILTER (WHERE b.id IS NOT NULL),
          '[]'
        ) as batches
      FROM skus s
      LEFT JOIN stock_batches b ON s.id = b.sku_id ${userId ? `AND b.user_id = '${userId}'` : ''}
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (s.name ILIKE $${params.length} OR s.code ILIKE $${params.length} OR s.barcode ILIKE $${params.length} OR s.company_name ILIKE $${params.length})`;
    }

    if (companyId && companyId !== 'All' && companyId !== 'all') {
      params.push(companyId);
      sql += ` AND s.company_id = $${params.length}`;
    }

    if (mustSell !== undefined && mustSell !== 'All') {
      params.push(mustSell === 'true' || mustSell === true);
      sql += ` AND s.must_sell = $${params.length}`;
    }

    // Status filter: Low Stock (<100 cs), Healthy (>=100 cs)
    if (status === 'low_stock') {
      sql += ` AND s.stock_cases < 100`;
    } else if (status === 'healthy') {
      sql += ` AND s.stock_cases >= 100`;
    }

    sql += ' GROUP BY s.id ORDER BY s.name ASC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async getInventoryStats(userId) {
    let lowStockQuery = `SELECT COUNT(*) as count FROM skus s JOIN stock_batches b ON s.id = b.sku_id WHERE s.stock_cases < 100`;
    let nearExpiryQuery = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(b.cases_available * s.rate * s.units_per_case), 0) as "estimatedValue"
      FROM stock_batches b
      JOIN skus s ON b.sku_id = s.id
      WHERE (b.days_to_expiry < 90 OR b.status ILIKE '%Near Expiry%')
    `;
    let totalValQuery = `
      SELECT 
        COALESCE(SUM(b.cases_available * s.rate * s.units_per_case + b.pcs_available * s.rate), 0) as "totalValue",
        COALESCE(SUM(b.cases_available), 0) as "totalCases",
        COUNT(DISTINCT s.id) as "totalSkus"
      FROM skus s
      JOIN stock_batches b ON s.id = b.sku_id
      WHERE 1=1
    `;

    const params = [];
    if (userId) {
      params.push(userId);
      lowStockQuery += ` AND b.user_id = $1`;
      nearExpiryQuery += ` AND b.user_id = $1`;
      totalValQuery += ` AND b.user_id = $1`;
    }

    const [lowStockRes, nearExpiryRes, totalValRes] = await Promise.all([
      db.query(lowStockQuery, params),
      db.query(nearExpiryQuery, params),
      db.query(totalValQuery, params)
    ]);

    const totalStockVal = parseFloat(totalValRes.rows[0]?.totalValue || 0);

    return {
      lowCoverCount: parseInt(lowStockRes.rows[0]?.count || 0, 10),
      nearExpiryValue: parseFloat(nearExpiryRes.rows[0]?.estimatedValue || 0),
      damagedValue: totalStockVal > 0 ? 140000 : 0,
      totalStockValue: totalStockVal,
      totalCases: parseInt(totalValRes.rows[0]?.totalCases || 0, 10),
      totalSkus: parseInt(totalValRes.rows[0]?.totalSkus || 0, 10),
    };
  }

  static async addBatch(batchData) {
    const sql = `
      INSERT INTO stock_batches 
      (sku_id, batch_number, mfg_date, expiry_date, days_to_expiry, cases_available, pcs_available, location, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await db.query(sql, [
      batchData.skuId,
      batchData.batchNumber,
      batchData.mfgDate,
      batchData.expiryDate,
      batchData.daysToExpiry || 180,
      batchData.casesAvailable || 0,
      batchData.pcsAvailable || 0,
      batchData.location || 'Main Godown (Bay A)',
      batchData.status || 'Healthy',
    ]);
    return result.rows[0];
  }

  static async inwardGRNScan({ barcode, skuId, cases, pcs, batchNumber, mfgDate, expiryDate, location }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      let sku = null;
      if (barcode) {
        const r = await client.query('SELECT * FROM skus WHERE barcode = $1 OR code = $1', [barcode.trim()]);
        sku = r.rows[0];
      }
      if (!sku && skuId) {
        const r = await client.query('SELECT * FROM skus WHERE id = $1', [skuId]);
        sku = r.rows[0];
      }

      if (!sku) {
        throw { status: 404, message: `No SKU found with barcode/code "${barcode || skuId}"` };
      }

      const addCases = parseInt(cases || 0, 10);
      const addPcs = parseInt(pcs || 0, 10);

      const updatedSkuRes = await client.query(`
        UPDATE skus 
        SET stock_cases = stock_cases + $1,
            stock_pcs = stock_pcs + $2
        WHERE id = $3
        RETURNING *
      `, [addCases, addPcs, sku.id]);

      const generatedBatch = batchNumber || `BT-${Date.now().toString(36).toUpperCase()}`;
      const batchRes = await client.query(`
        INSERT INTO stock_batches 
        (sku_id, batch_number, mfg_date, expiry_date, cases_available, pcs_available, location, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Healthy')
        RETURNING *
      `, [
        sku.id,
        generatedBatch,
        mfgDate || 'Current Month',
        expiryDate || '1 Year Ahead',
        addCases,
        addPcs,
        location || 'Main Godown (Bay A)',
      ]);

      await client.query('COMMIT');

      return {
        sku: updatedSkuRes.rows[0],
        batch: batchRes.rows[0],
        message: `Inwarded ${addCases} cases & ${addPcs} pcs for ${sku.name}`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = GodownModel;
