const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/health', (_req, res) => res.json({ success: true, message: 'Service is up and running.' }));
app.use('/api', routes);

// 404 + global error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
