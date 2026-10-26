const GodownModel = require('../models/godown.model');

class GodownService {
  static async getInventory(filters) {
    return await GodownModel.getInventoryLedger(filters);
  }

  static async getDashboardStats(userId) {
    return await GodownModel.getInventoryStats(userId);
  }

  static async addNewBatch(batchData) {
    if (!batchData.skuId || !batchData.batchNumber || !batchData.expiryDate) {
      throw { status: 400, message: 'skuId, batchNumber, and expiryDate are required' };
    }
    return await GodownModel.addBatch(batchData);
  }

  static async processInwardScan(scanPayload) {
    if (!scanPayload.barcode && !scanPayload.skuId) {
      throw { status: 400, message: 'Please provide either a Barcode or SKU ID to scan' };
    }
    return await GodownModel.inwardGRNScan(scanPayload);
  }
}

module.exports = GodownService;
