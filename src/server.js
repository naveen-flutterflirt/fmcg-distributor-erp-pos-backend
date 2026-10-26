const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/company.routes');
const skuRoutes = require('./routes/sku.routes');
const outletRoutes = require('./routes/outlet.routes');
const orderRoutes = require('./routes/order.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const godownRoutes = require('./routes/godown.routes');
const schemeRoutes = require('./routes/scheme.routes');
const claimRoutes = require('./routes/claim.routes');
const collectionRoutes = require('./routes/collection.routes');
const accountRoutes = require('./routes/account.routes');
const fieldTeamRoutes = require('./routes/fieldTeam.routes');
const reportRoutes = require('./routes/report.routes');
const vanRoutes = require('./routes/van.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const settingsRoutes = require('./routes/settings.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { protect } = require('./middlewares/auth.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint (Public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'FMCG Distributor ERP Backend',
  });
});

// Authentication routes (Public: /login, /register; Protected: /me)
app.use('/api/auth', authRoutes);

// Protected ERP & POS Business Routes (Protected by JWT)
app.use('/api/companies', protect, companyRoutes);
app.use('/api/skus', protect, skuRoutes);
app.use('/api/outlets', protect, outletRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/purchase', protect, purchaseRoutes);
app.use('/api/godown', protect, godownRoutes);
app.use('/api/schemes', protect, schemeRoutes);
app.use('/api/claims', protect, claimRoutes);
app.use('/api/collections', protect, collectionRoutes);
app.use('/api/accounts', protect, accountRoutes);
app.use('/api/field-team', protect, fieldTeamRoutes);
app.use('/api/reports', protect, reportRoutes);
app.use('/api/van-sales', protect, vanRoutes);
app.use('/api/delivery', protect, deliveryRoutes);
app.use('/api/settings', protect, settingsRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Centralized Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`FMCG POS Backend listening on http://localhost:${PORT}`);
});
