const ClaimService = require('../services/claim.service');

class ClaimController {
  static async getClaims(req, res, next) {
    try {
      const { search, companyId, status } = req.query;
      const userId = req.user?.id;
      const claims = await ClaimService.getAllClaims({ search, companyId, status, userId });
      res.json({ success: true, count: claims.length, data: claims });
    } catch (err) {
      next(err);
    }
  }

  static async getClaimById(req, res, next) {
    try {
      const userId = req.user?.id;
      const claim = await ClaimService.getClaimById(req.params.id, userId);
      res.json({ success: true, data: claim });
    } catch (err) {
      next(err);
    }
  }

  static async raiseClaim(req, res, next) {
    try {
      const userId = req.user?.id;
      const claim = await ClaimService.raiseClaim({ ...req.body, userId });
      res.status(201).json({ success: true, message: 'Claim raised successfully', data: claim });
    } catch (err) {
      next(err);
    }
  }

  static async replyQuery(req, res, next) {
    try {
      const result = await ClaimService.replyQuery(req.params.id, req.body.replyText);
      res.json({ success: true, message: 'Audit reply submitted', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req, res, next) {
    try {
      const userId = req.user?.id;
      const stats = await ClaimService.getStats(userId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ClaimController;
