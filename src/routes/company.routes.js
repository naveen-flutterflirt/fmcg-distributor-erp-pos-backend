const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/company.controller');

router.get('/', CompanyController.getCompanies);
router.get('/:id', CompanyController.getCompanyById);
router.post('/', CompanyController.createCompany);

module.exports = router;
