const OutletService = require('../services/outlet.service');

class OutletController {
  static async getOutlets(req, res, next) {
    try {
      const { search, route, status, channel } = req.query;
      const userId = req.user?.id;
      const outlets = await OutletService.getAllOutlets({ search, route, status, channel, userId });
      res.json({ success: true, count: outlets.length, data: outlets });
    } catch (err) {
      next(err);
    }
  }

  static async getOutletById(req, res, next) {
    try {
      const userId = req.user?.id;
      const outlet = await OutletService.getOutletById(req.params.id, userId);
      res.json({ success: true, data: outlet });
    } catch (err) {
      next(err);
    }
  }

  static async createOutlet(req, res, next) {
    try {
      const userId = req.user?.id;
      const outlet = await OutletService.createOutlet({ ...req.body, userId });
      res.status(201).json({ success: true, data: outlet });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OutletController;
