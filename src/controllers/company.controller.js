const CompanyService = require('../services/company.service');

class CompanyController {
  static async getCompanies(req, res, next) {
    try {
      const companies = await CompanyService.getAllCompanies();
      res.json({ success: true, count: companies.length, data: companies });
    } catch (err) {
      next(err);
    }
  }

  static async getCompanyById(req, res, next) {
    try {
      const company = await CompanyService.getCompanyById(req.params.id);
      res.json({ success: true, data: company });
    } catch (err) {
      next(err);
    }
  }

  static async createCompany(req, res, next) {
    try {
      const company = await CompanyService.createCompany(req.body);
      res.status(201).json({ success: true, message: 'Company created successfully', data: company });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CompanyController;
