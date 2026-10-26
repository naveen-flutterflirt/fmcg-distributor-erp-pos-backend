const VanModel = require('../models/van.model');

class VanService {
  static async getActiveTrip(userId) {
    return await VanModel.getActiveTrip(userId);
  }

  static async settleTrip(id, data) {
    return await VanModel.settleTrip(id, data);
  }
}

module.exports = VanService;
