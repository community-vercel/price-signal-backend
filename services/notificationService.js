// import admin from 'firebase-admin';
// import Asset from '../models/Asset.js';
// import UserDevice from '../models/UserDevice.js';

// // Initialize Firebase Admin with individual environment variables
// // Important: Replace newlines in private key (if using environment variables)
// console.log('Environment Variables:', {
//   FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
//   FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
//   FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'exists' : 'missing'
// });

// const NOTIFICATION_COOLDOWN_MS = 3600000; // 1 hour
// const notificationCooldown = new Map()

// /**
//  * Checks asset prices and sends notifications when thresholds are met
//  */
// export const checkPriceAndNotify = async () => {
//   try {
//     console.log('Starting price check notification job');
    
//     const [assets, cryptoPrices] = await Promise.all([
//       Asset.find({ notificationEnabled: true }),
//       fetchCryptoPrices()
//     ]);

//     const notificationPromises = assets.map(async (asset) => {
//       const crypto = cryptoPrices.find(c => c.symbol === asset.symbol);
//       if (!crypto) return;

//       const currentPrice = crypto.price;
//       const priceChange = calculatePercentageChange(asset.purchasePrice, currentPrice);
      
//       if (shouldNotify(asset, priceChange)) {
//         return sendPriceAlert(asset, priceChange, currentPrice);
//       }
//     });

//     await Promise.all(notificationPromises);
//     console.log('Completed price check notification job');

//   } catch (error) {
//     console.error('Price check notification job failed:', error);
//     // Add your error reporting here (Sentry, etc.)
//   }
// };

// // Helper functions
// const calculatePercentageChange = (oldPrice, newPrice) => {
//   return ((newPrice - oldPrice) / oldPrice) * 100;
// };

// const shouldNotify = (asset, priceChange) => {
//   const lastNotified = notificationCooldown.get(asset.id) || 0;
//   const now = Date.now();
  
//   return priceChange >= asset.notificationThreshold && 
//          (now - lastNotified) > NOTIFICATION_COOLDOWN_MS;
// };

// const sendPriceAlert = async (asset, priceChange, currentPrice) => {
//   try {
//     const title = '💰 Price Alert';
//     const body = `${asset.name} +${priceChange.toFixed(2)}% ($${currentPrice.toFixed(2)})`;
    
//     await sendNotification(asset.userId, title, body);
//     notificationCooldown.set(asset.id, Date.now());
    
//   } catch (error) {
//     console.error(`Failed to send alert for ${asset.symbol}:`, error);
//   }
// };

// /**
//  * Sends FCM notification to all of user's devices
//  */
// const sendNotification = async (userId, title, body) => {
//   try {
//     const devices = await UserDevice.find({ userId });
//     if (!devices.length) return;

//     const messages = devices.map(device => ({
//       token: device.fcmToken,
//       notification: { title, body },
//       android: { priority: 'high' },
//       apns: {
//         payload: {
//           aps: {
//             sound: 'default',
//             badge: 1
//           }
//         }
//       }
//     }));

//     const batchResponse = await firebaseAdmin.messaging().sendAll(messages);
//     logNotificationResults(userId, batchResponse, devices);

//   } catch (error) {
//     console.error(`Notification send failed for user ${userId}:`, error);
//     throw error;
//   }
// };

// const logNotificationResults = (userId, batchResponse, devices) => {
//   console.log(`Sent notifications to user ${userId}`, {
//     successCount: batchResponse.successCount,
//     failureCount: batchResponse.failureCount
//   });

//   batchResponse.responses.forEach((response, index) => {
//     if (!response.success) {
//       console.error(`Failed to send to device ${devices[index].deviceId}:`, 
//         response.error);
//     }
//   });
// };