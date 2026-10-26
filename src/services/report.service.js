const ReportModel = require('../models/report.model');

class ReportService {
  static async getExecutiveKPIs(userId) {
    return await ReportModel.getExecutiveKPIs(userId);
  }

  static async exportReport(type, userId) {
    const report = await ReportModel.exportReport(type, userId);
    
    // Convert JSON rows to CSV string
    if (!report.rows || report.rows.length === 0) {
      return { filename: report.filename, csvContent: 'No data available' };
    }

    const headers = Object.keys(report.rows[0]);
    const csvLines = [headers.join(',')];

    for (const row of report.rows) {
      const values = headers.map(h => {
        let val = row[h];
        if (val === null || val === undefined) val = '';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvLines.push(values.join(','));
    }

    return {
      filename: report.filename,
      csvContent: csvLines.join('\n')
    };
  }
}

module.exports = ReportService;
