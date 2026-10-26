const ReportService = require('../services/report.service');

const getExecutiveKPIs = async (req, res) => {
  try {
    const userId = req.user?.id;
    const data = await ReportService.getExecutiveKPIs(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('API Error in getExecutiveKPIs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadReport = async (req, res) => {
  try {
    const { type = 'dsr' } = req.query;
    const userId = req.user?.id;
    const { filename, csvContent } = await ReportService.exportReport(type, userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('API Error in downloadReport:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExecutiveKPIs,
  downloadReport
};
