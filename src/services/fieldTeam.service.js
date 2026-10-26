const FieldTeamModel = require('../models/fieldTeam.model');

class FieldTeamService {
  static async getAllSalesmen(userId) {
    return await FieldTeamModel.getAllSalesmen(userId);
  }

  static async createSalesman(data) {
    const beatName = data.beat_name || data.beatName || data.assignedRoute || data.route;
    if (!data.name || !beatName) {
      throw new Error('Name and Beat Name are required for adding a Salesman.');
    }
    return await FieldTeamModel.createSalesman({
      ...data,
      beat_name: beatName
    });
  }

  static async updateCallProgress(id, data) {
    return await FieldTeamModel.updateCallProgress(id, data);
  }
}

module.exports = FieldTeamService;
