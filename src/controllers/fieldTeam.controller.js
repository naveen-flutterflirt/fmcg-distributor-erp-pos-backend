const FieldTeamService = require('../services/fieldTeam.service');

const getAllSalesmen = async (req, res) => {
  try {
    const userId = req.user?.id;
    const data = await FieldTeamService.getAllSalesmen(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('API Error in getAllSalesmen:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSalesman = async (req, res) => {
  try {
    const userId = req.user?.id;
    const salesman = await FieldTeamService.createSalesman({ ...req.body, userId });
    res.status(201).json({ success: true, data: salesman });
  } catch (error) {
    console.error('API Error in createSalesman:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCallProgress = async (req, res) => {
  try {
    const updated = await FieldTeamService.updateCallProgress(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('API Error in updateCallProgress:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllSalesmen,
  createSalesman,
  updateCallProgress
};
