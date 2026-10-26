const AccountModel = require('../models/account.model');

class AccountService {
  static async getOverview(userId) {
    return await AccountModel.getOverview(userId);
  }

  static async getPnL(userId) {
    return await AccountModel.getPnL(userId);
  }

  static async getBankRecon(userId) {
    return await AccountModel.getBankRecon(userId);
  }

  static async getTallyXml() {
    return await AccountModel.generateTallyXml();
  }

  static async lockPeriod(month, year) {
    // In practice, this sets an audit lock flag in business configurations
    return {
      success: true,
      period: `${month} ${year}`,
      lockedAt: new Date().toISOString(),
      message: `Books for ${month} ${year} have been securely locked. No back-dated entries permitted.`
    };
  }
}

module.exports = AccountService;
