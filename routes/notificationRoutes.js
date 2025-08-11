import express from 'express'
import { getRecentNotifications } from './../services/priceMonitor.js';
const router = express.Router();

router.get('/users/:userId/notifications', async (req, res) => {
 try {
    const notifications = await getRecentNotifications(req.params.userId);
    
    // Transform the data to match frontend expectations
    const transformed = notifications.map(day => ({
      date: day.date,
      notifications: day.notifications.map(notif => ({
        _id: notif._id || notif.assetId,
        type: 'price_alert',
        message: notif.body || notif.message || `Price update for ${notif.symbol || notif.assetName}`,
        createdAt: notif.timestamp || notif.createdAt,
        assetName: notif.assetName || notif.symbol,
        prevPrice: notif.prevPrice,
        currentPrice: notif.currentPrice,
        read: false // Default to unread
      }))
    }));
    
    res.json({ data: transformed });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});
export default router