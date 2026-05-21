const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const loggerMiddleware = require('./middlewares/loggerMiddleware');
const errorHandler = require('./middlewares/errorHandler');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use(loggerMiddleware);

app.use('/api/health', healthRoutes);

app.use(errorHandler);

module.exports = app;
