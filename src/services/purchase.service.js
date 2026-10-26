const PurchaseModel = require('../models/purchase.model');

class PurchaseService {
  static async getAllPOs(filters) {
    return await PurchaseModel.findAll(filters);
  }

  static async getPOById(id, userId) {
    const po = await PurchaseModel.findById(id, userId);
    if (!po) {
      throw { status: 404, message: 'Purchase Order not found' };
    }
    return po;
  }

  static async createPO(payload) {
    if (!payload.id) {
      payload.id = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    }
    if (!payload.date) {
      payload.date = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return await PurchaseModel.createPO(payload);
  }

  static async receiveGRN(poId, grnData) {
    const existing = await PurchaseModel.findById(poId);
    if (!existing) {
      throw { status: 404, message: 'Purchase Order not found' };
    }
    return await PurchaseModel.processGRN(poId, grnData);
  }
}

module.exports = PurchaseService;
