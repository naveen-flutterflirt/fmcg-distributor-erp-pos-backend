const SkuService = require('../services/sku.service');

class SkuController {
  static async getSkus(req, res, next) {
    try {
      const { search, companyId, mustSell } = req.query;
      const skus = await SkuService.getAllSkus({
        search,
        companyId,
        mustSell: mustSell !== undefined ? mustSell === 'true' : undefined,
      });
      res.json({ success: true, count: skus.length, data: skus });
    } catch (err) {
      next(err);
    }
  }

  static async getSkuById(req, res, next) {
    try {
      const sku = await SkuService.getSkuById(req.params.id);
      res.json({ success: true, data: sku });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SkuController;
