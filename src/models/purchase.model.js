const db = require('../config/db');

class PurchaseModel {
  static async findAll({ status, companyId, search, userId } = {}) {
    let sql = `
      SELECT 
        po.id, po.company_id as "companyId", po.company_name as "company",
        po.po_date as "date", po.total_amount::float as "totalAmount",
        po.status, po.grn_status as "grnStatus", po.items_count as "itemsCount",
        po.dispatch_ref as "dispatchRef", po.invoice_number as "invoiceNumber",
        po.notes, po.created_at as "createdAt",
        COALESCE(
          json_agg(
            json_build_object(
              'id', poi.id,
              'skuId', poi.sku_id,
              'skuName', poi.sku_name,
              'casesOrdered', poi.cases_ordered,
              'pcsOrdered', poi.pcs_ordered,
              'casesReceived', poi.cases_received,
              'pcsReceived', poi.pcs_received,
              'rate', poi.rate::float,
              'amount', poi.amount::float,
              'batchNumber', poi.batch_number,
              'expiryDate', poi.expiry_date
            )
          ) FILTER (WHERE poi.id IS NOT NULL),
          '[]'
        ) as items
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(userId);
      sql += ` AND po.user_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND po.status = $${params.length}`;
    }

    if (companyId && companyId !== 'all') {
      params.push(companyId);
      sql += ` AND po.company_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (po.id ILIKE $${params.length} OR po.company_name ILIKE $${params.length} OR po.dispatch_ref ILIKE $${params.length})`;
    }

    sql += ' GROUP BY po.id ORDER BY po.created_at DESC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const sql = `
      SELECT 
        po.id, po.company_id as "companyId", po.company_name as "company",
        po.po_date as "date", po.total_amount::float as "totalAmount",
        po.status, po.grn_status as "grnStatus", po.items_count as "itemsCount",
        po.dispatch_ref as "dispatchRef", po.invoice_number as "invoiceNumber",
        po.notes, po.created_at as "createdAt",
        COALESCE(
          json_agg(
            json_build_object(
              'id', poi.id,
              'skuId', poi.sku_id,
              'skuName', poi.sku_name,
              'casesOrdered', poi.cases_ordered,
              'pcsOrdered', poi.pcs_ordered,
              'casesReceived', poi.cases_received,
              'pcsReceived', poi.pcs_received,
              'rate', poi.rate::float,
              'amount', poi.amount::float,
              'batchNumber', poi.batch_number,
              'expiryDate', poi.expiry_date
            )
          ) FILTER (WHERE poi.id IS NOT NULL),
          '[]'
        ) as items
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
      WHERE po.id = $1
      GROUP BY po.id
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  static async createPO(poData) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const {
        id,
        userId = null,
        companyId,
        companyName,
        date,
        totalAmount,
        status = 'In Transit',
        grnStatus = 'Pending GRN Scan',
        itemsCount = 0,
        dispatchRef = null,
        invoiceNumber = null,
        notes = null,
        items = [],
      } = poData;

      const poSql = `
        INSERT INTO purchase_orders 
        (id, user_id, company_id, company_name, po_date, total_amount, status, grn_status, items_count, dispatch_ref, invoice_number, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const poResult = await client.query(poSql, [
        id,
        userId,
        companyId,
        companyName,
        date,
        totalAmount,
        status,
        grnStatus,
        itemsCount || items.length,
        dispatchRef,
        invoiceNumber,
        notes,
      ]);

      for (const item of items) {
        const itemSql = `
          INSERT INTO purchase_order_items 
          (po_id, sku_id, sku_name, cases_ordered, pcs_ordered, cases_received, pcs_received, rate, amount, batch_number, expiry_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        await client.query(itemSql, [
          id,
          item.skuId,
          item.skuName,
          item.casesOrdered || 0,
          item.pcsOrdered || 0,
          item.casesReceived || 0,
          item.pcsReceived || 0,
          item.rate,
          item.amount,
          item.batchNumber || null,
          item.expiryDate || null,
        ]);
      }

      await client.query('COMMIT');
      return poResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // GRN Receipt: when stock arrives, update PO and INWARD stock into SKUs and Batches
  static async processGRN(poId, grnData) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update PO Status
      const updatePoSql = `
        UPDATE purchase_orders 
        SET status = 'Received & Verified',
            grn_status = $1
        WHERE id = $2
        RETURNING *
      `;
      const poRes = await client.query(updatePoSql, [grnData.grnStatus || 'GRN Verified', poId]);

      // 2. Add received quantities into SKUs and Stock Batches
      if (grnData.receivedItems && grnData.receivedItems.length > 0) {
        for (const item of grnData.receivedItems) {
          // Increase SKU main godown stock
          await client.query(`
            UPDATE skus 
            SET stock_cases = stock_cases + $1,
                stock_pcs = stock_pcs + $2
            WHERE id = $3
          `, [item.casesReceived || 0, item.pcsReceived || 0, item.skuId]);

          // Create or update batch
          if (item.batchNumber) {
            await client.query(`
              INSERT INTO stock_batches 
              (sku_id, batch_number, mfg_date, expiry_date, cases_available, pcs_available, location, status)
              VALUES ($1, $2, $3, $4, $5, $6, $7, 'Healthy')
            `, [
              item.skuId,
              item.batchNumber,
              item.mfgDate || 'Current Month',
              item.expiryDate || '1 Year Ahead',
              item.casesReceived || 0,
              item.pcsReceived || 0,
              item.location || 'Main Godown (Bay A)',
            ]);
          }
        }
      }

      await client.query('COMMIT');
      return poRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = PurchaseModel;
