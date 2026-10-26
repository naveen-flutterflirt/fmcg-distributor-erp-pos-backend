const GodownService = require('../services/godown.service');

class GodownController {
  static async getInventory(req, res, next) {
    try {
      const { search, companyId, status, mustSell } = req.query;
      const userId = req.user?.id;
      const ledger = await GodownService.getInventory({ search, companyId, status, mustSell, userId });
      res.json({ success: true, count: ledger.length, data: ledger });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req, res, next) {
    try {
      const userId = req.user?.id;
      const stats = await GodownService.getDashboardStats(userId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  static async addBatch(req, res, next) {
    try {
      const batch = await GodownService.addNewBatch(req.body);
      res.status(201).json({ success: true, message: 'Stock batch added', data: batch });
    } catch (err) {
      next(err);
    }
  }

  static async inwardScan(req, res, next) {
    try {
      const result = await GodownService.processInwardScan(req.body);
      res.status(200).json({ success: true, message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = GodownController;
