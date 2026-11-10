const mongoose = require('mongoose');
const processedWebhookSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: [true, 'Event ID is required'], unique: true, trim: true },
    eventType: { type: String, required: [true, 'Event type is required'], trim: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
processedWebhookSchema.index({ eventId: 1 }, { unique: true });
processedWebhookSchema.index({ eventType: 1, processedAt: -1 });
module.exports = mongoose.model('ProcessedWebhook', processedWebhookSchema);