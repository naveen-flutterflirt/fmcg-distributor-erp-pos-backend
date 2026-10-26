const SchemeModel = require('../models/scheme.model');

class SchemeService {
  static async getAllSchemes(filters) {
    return await SchemeModel.findAll(filters);
  }

  static async createScheme(schemeData) {
    if (!schemeData.name || !schemeData.companyName) {
      throw { status: 400, message: 'Scheme name and Company name are required' };
    }
    return await SchemeModel.createScheme(schemeData);
  }

  static async getStats(userId) {
    return await SchemeModel.getStats(userId);
  }
}

module.exports = SchemeService;
