const DeliveryModel = require('../models/delivery.model');

class DeliveryService {
  static async getAllTrips(userId) {
    return await DeliveryModel.getAllTrips(userId);
  }

  static async addOrdersToTrip(data) {
    if (!data.orderIds || data.orderIds.length === 0) {
      throw new Error('No orders selected for trip dispatch.');
    }
    return await DeliveryModel.addOrdersToTrip(data);
  }

  static async createTrip(data) {
    if (!data.vehicle || !data.driver || !data.route) {
      throw new Error('Vehicle, Driver, and Route are required for planning a trip.');
    }
    return await DeliveryModel.createTrip(data);
  }
}

module.exports = DeliveryService;
