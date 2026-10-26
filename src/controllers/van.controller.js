const VanService = require('../services/van.service');

const getActiveTrip = async (req, res) => {
  try {
    const userId = req.user?.id;
    const data = await VanService.getActiveTrip(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('API Error in getActiveTrip:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const settleTrip = async (req, res) => {
  try {
    const data = await VanService.settleTrip(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    console.error('API Error in settleTrip:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActiveTrip,
  settleTrip
};
