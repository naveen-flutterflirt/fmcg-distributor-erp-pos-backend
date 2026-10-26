const ClaimModel = require('../models/claim.model');

class ClaimService {
  static async getAllClaims(filters) {
    return await ClaimModel.findAll(filters);
  }

  static async getClaimById(id, userId) {
    const claim = await ClaimModel.findById(id, userId);
    if (!claim) {
      throw { status: 404, message: 'Claim not found' };
    }
    return claim;
  }

  static async raiseClaim(claimData) {
    if (!claimData.company || !claimData.amount) {
      throw { status: 400, message: 'Company and claim amount are required' };
    }
    return await ClaimModel.createClaim(claimData);
  }

  static async replyQuery(id, replyText) {
    if (!replyText) {
      throw { status: 400, message: 'Reply text cannot be empty' };
    }
    return await ClaimModel.replyQuery(id, replyText);
  }

  static async getStats(userId) {
    return await ClaimModel.getStats(userId);
  }
}

module.exports = ClaimService;
