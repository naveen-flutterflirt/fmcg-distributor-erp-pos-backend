const SchemeService = require('../services/scheme.service');

class SchemeController {
  static async getSchemes(req, res, next) {
    try {
      const { search, companyId, fundedBy, status } = req.query;
      const userId = req.user?.id;
      const schemes = await SchemeService.getAllSchemes({ search, companyId, fundedBy, status, userId });
      res.json({ success: true, count: schemes.length, data: schemes });
    } catch (err) {
      next(err);
    }
  }

  static async createScheme(req, res, next) {
    try {
      const userId = req.user?.id;
      const scheme = await SchemeService.createScheme({ ...req.body, userId });
      res.status(201).json({ success: true, message: 'Scheme created successfully', data: scheme });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req, res, next) {
    try {
      const userId = req.user?.id;
      const stats = await SchemeService.getStats(userId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SchemeController;
