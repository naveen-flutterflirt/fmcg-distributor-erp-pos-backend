const CollectionService = require('../services/collection.service');

class CollectionController {
  static async getLedger(req, res, next) {
    try {
      const { search, route, status, overdueOnly } = req.query;
      const userId = req.user?.id;
      const ledger = await CollectionService.getLedger({ search, route, status, overdueOnly, userId });
      res.json({ success: true, count: ledger.length, data: ledger });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req, res, next) {
    try {
      const userId = req.user?.id;
      const stats = await CollectionService.getStats(userId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  static async recordReceipt(req, res, next) {
    try {
      const result = await CollectionService.recordReceipt(req.body);
      res.status(201).json({ success: true, message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getReceiptsHistory(req, res, next) {
    try {
      const { outletId } = req.query;
      const history = await CollectionService.getReceiptsHistory({ outletId });
      res.json({ success: true, count: history.length, data: history });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CollectionController;
