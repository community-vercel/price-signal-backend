import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: false }, // Added currentPrice field
  userId: { type: String, required: true }, // Added userId field
  date: { type: Date, required: true },
  exchange: { type: String, required: true },
  notes: { type: String, default: '' },
  lastApiPriceUpdate: { type: Date }, // Track when we last got API price
  priceChangeThreshold: { type: Number, default: 1 } // % change needed for alerts


}, { timestamps: true });

export default mongoose.model('Asset', assetSchema);