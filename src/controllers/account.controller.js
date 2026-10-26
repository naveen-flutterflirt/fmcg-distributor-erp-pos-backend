const AccountService = require('../services/account.service');

const getOverview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const data = await AccountService.getOverview(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('API Error in getOverview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPnL = async (req, res) => {
  try {
    const userId = req.user?.id;
    const data = await AccountService.getPnL(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('API Error in getPnL:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBankRecon = async (req, res) => {
  try {
    const userId = req.user?.id;
    const data = await AccountService.getBankRecon(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('API Error in getBankRecon:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadTallyXml = async (req, res) => {
  try {
    const xml = await AccountService.getTallyXml();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="tally_vouchers_export.xml"');
    res.send(xml);
  } catch (error) {
    console.error('API Error in downloadTallyXml:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const lockPeriod = async (req, res) => {
  try {
    const { month = 'September', year = '2026' } = req.body;
    const result = await AccountService.lockPeriod(month, year);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error in lockPeriod:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOverview,
  getPnL,
  getBankRecon,
  downloadTallyXml,
  lockPeriod
};
