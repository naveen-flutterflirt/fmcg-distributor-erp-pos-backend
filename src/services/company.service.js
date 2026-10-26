const CompanyModel = require('../models/company.model');

class CompanyService {
  static async getAllCompanies() {
    return await CompanyModel.findAll();
  }

  static async getCompanyById(id) {
    const comp = await CompanyModel.findById(id);
    if (!comp) {
      throw { status: 404, message: 'Company not found' };
    }
    return comp;
  }

  static async createCompany({ name, category, id }) {
    if (!name) {
      throw { status: 400, message: 'Company name is required' };
    }
    const companyId = id || `comp-${Date.now().toString(36)}`;
    return await CompanyModel.createCompany({ id: companyId, name, category: category || 'General FMCG' });
  }
}

module.exports = CompanyService;
