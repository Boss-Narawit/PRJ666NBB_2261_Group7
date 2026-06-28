const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const errorHandler = require('./middlewares/errorHandler');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clothingRoutes = require('./routes/clothingRoutes');
const thoughtfulPurchaseRoutes = require('./routes/thoughtfulPurchaseRoutes');
const wearLogRoutes = require('./routes/wearLogRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const similarityRoutes = require('./routes/similarityRoutes');
const exportRoutes = require('./routes/exportRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const syncRoutes = require('./routes/syncRoutes');
const extensionRoutes = require('./routes/extensionRoutes');

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clothing', clothingRoutes);
app.use('/api/thoughtful-purchase', thoughtfulPurchaseRoutes);
app.use('/api/wear-logs', wearLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/similarity', similarityRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/extension', extensionRoutes);

app.use(errorHandler);

module.exports = app;
