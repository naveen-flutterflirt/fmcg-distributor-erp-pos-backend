const CollectionModel = require('../models/collection.model');

class CollectionService {
  static async getLedger(filters) {
    return await CollectionModel.getLedger(filters);
  }

  static async getStats(userId) {
    return await CollectionModel.getStats(userId);
  }

  static async recordReceipt(receiptData) {
    const outletId = receiptData.outletId || receiptData.outlet_id;
    const amount = Number(receiptData.amount);
    if (!outletId || !amount || amount <= 0) {
      throw { status: 400, message: 'Valid outletId and collection amount are required' };
    }
    return await CollectionModel.recordReceipt({
      ...receiptData,
      outletId,
      amount
    });
  }

  static async getReceiptsHistory(filters) {
    return await CollectionModel.getReceiptsHistory(filters);
  }
}

module.exports = CollectionService;
