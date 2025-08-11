// import admin from 'firebase-admin';
// import User from '../models/User.js';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { readFileSync } from 'fs';

// // Get current module path
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load service account file
// const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
// const serviceAccount = JSON.parse(readFileSync(serviceAccountPath));

// // Initialize Firebase Admin
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
// console.log('Firebase Admin initialized successfully');

// export const registerToken = async (req, res) => {
//   try {
//     const { userId, fcmToken } = req.body;
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     user.fcmToken = fcmToken;
//     await user.save();
    
//     res.status(200).json({ message: 'Token registered successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const sendPriceAlertNotification = async (token, assetName, currentPrice, changePercent) => {
//   const message = {
//     notification: {
//       title: 'Price Alert!',
//       body: `${assetName} has ${changePercent >= 0 ? 'increased' : 'decreased'} ${Math.abs(changePercent).toFixed(2)}% to $${currentPrice.toFixed(2)}`,
//       sound: 'default'
//     },
//     data: {
//       assetName,
//       currentPrice: currentPrice.toString(),
//       changePercent: changePercent.toString(),
//       click_action: 'OPEN_ASSET_DETAIL' // Custom action for React Native
//     },
//     token,
//     android: {
//       priority: 'high',
//       notification: {
//         sound: 'default',
//         channel_id: 'price_alerts',
//         vibrate: [300, 200, 300],
//         click_action: 'OPEN_ASSET_DETAIL' // Android-specific click action
//       }
//     },
//     apns: {
//       payload: {
//         aps: {
//           sound: 'default',
//           badge: 1
//         }
//       }
//     }
//   };

//   try {
//     await admin.messaging().send(message);
//     console.log('Notification sent successfully');
//     return true;
//   } catch (error) {
//     console.error('Error sending notification:', error);
//     return false;
//   }
// };