const stripe = require('stripe');
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
module.exports = { stripeClient };