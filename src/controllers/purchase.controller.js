const PurchaseService = require('../services/purchase.service');

class PurchaseController {
  static async getPurchaseOrders(req, res, next) {
    try {
      const { status, companyId, search } = req.query;
      const userId = req.user?.id;
      const pos = await PurchaseService.getAllPOs({ status, companyId, search, userId });
      res.json({ success: true, count: pos.length, data: pos });
    } catch (err) {
      next(err);
    }
  }

  static async getPOById(req, res, next) {
    try {
      const userId = req.user?.id;
      const po = await PurchaseService.getPOById(req.params.id, userId);
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  }

  static async createPO(req, res, next) {
    try {
      const userId = req.user?.id;
      const result = await PurchaseService.createPO({ ...req.body, userId });
      res.status(201).json({ success: true, message: 'Purchase Order created', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async receiveGRN(req, res, next) {
    try {
      const result = await PurchaseService.receiveGRN(req.params.id, req.body);
      res.json({ success: true, message: 'GRN processed and stock updated', data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PurchaseController;
