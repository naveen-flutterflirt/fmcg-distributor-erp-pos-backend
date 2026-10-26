const OutletModel = require('../models/outlet.model');

class OutletService {
  static async getAllOutlets(filters) {
    return await OutletModel.findAll(filters);
  }

  static async getOutletById(id) {
    const outlet = await OutletModel.findById(id);
    if (!outlet) {
      throw { status: 404, message: 'Outlet not found' };
    }
    return outlet;
  }

  static async createOutlet(data) {
    if (!data.name || !data.ownerName || !data.route || !data.phone) {
      throw { status: 400, message: 'Name, Owner Name, Route, and Phone are required.' };
    }
    return await OutletModel.createOutlet(data);
  }
}

module.exports = OutletService;
