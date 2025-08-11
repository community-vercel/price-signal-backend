import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  assetId: { type: String },
  symbol: { type: String },
  prevPrice: { type: Number },
  currentPrice: { type: Number },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);