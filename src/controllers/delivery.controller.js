const DeliveryService = require('../services/delivery.service');

const getAllTrips = async (req, res) => {
  try {
    const userId = req.user?.id;
    const data = await DeliveryService.getAllTrips(userId);
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('API Error in getAllTrips:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const dispatchOrdersToTrip = async (req, res) => {
  try {
    const userId = req.user?.id;
    const trip = await DeliveryService.addOrdersToTrip({ ...req.body, userId });
    res.json({ success: true, message: 'Orders successfully billed and assigned to delivery trip load sheet.', data: trip });
  } catch (error) {
    console.error('API Error in dispatchOrdersToTrip:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const createTrip = async (req, res) => {
  try {
    const userId = req.user?.id;
    const trip = await DeliveryService.createTrip({ ...req.body, userId });
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error('API Error in createTrip:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllTrips,
  dispatchOrdersToTrip,
  createTrip
};
