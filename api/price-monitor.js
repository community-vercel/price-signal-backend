// pages/api/price-monitor.js

import { checkPriceAndNotify } from '../services/priceMonitor.js';

export default async function handler(req, res) {
  try {
    await checkPriceAndNotify();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
