const SkuModel = require('../models/sku.model');

class SkuService {
  static async getAllSkus(filters) {
    return await SkuModel.findAll(filters);
  }

  static async getSkuById(id) {
    const sku = await SkuModel.findById(id);
    if (!sku) {
      throw { status: 404, message: 'SKU not found' };
    }
    return sku;
  }
}

module.exports = SkuService;
