import { checkPrices } from '../../services/PriceMonitor';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

//   // Optional: Add auth check for cron jobs
//   if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }

  const result = await checkPrices();
  res.status(result.success ? 200 : 500).json(result);
}