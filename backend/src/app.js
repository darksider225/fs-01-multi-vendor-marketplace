const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const paymentController = require('./controllers/payment.controller');

const app = express();

// Global middleware
app.use(cors());

// Webhook route (raw body for Stripe signature verification) - must be before express.json()
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Global JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/health', (_req, res) => res.json({ success: true, message: 'Service is up and running.' }));
app.use('/api', routes);

// 404 + global error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
