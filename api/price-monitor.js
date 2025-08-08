import { startPriceMonitoring } from '../services/priceMonitor.js';

export default async (req, res) => {
  startPriceMonitoring();
  res.status(200).send('Monitoring started');
};