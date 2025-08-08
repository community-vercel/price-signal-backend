// import axios from 'axios';
// import Asset from '../models/Asset.js';
// import User from '../models/User.js';
// import { sendPriceAlertNotification } from './../controller/notificationController.js';
// import { logError, logInfo } from '../config/logger.js';

// // Configuration
// const API_URL = 'https://coinranking1.p.rapidapi.com/coins';
// const API_HEADERS = {
//   'X-RapidAPI-Key':'db6f4c8bdbmsh7c06f5ac4f1e1ebp1e8908jsn4f501d04c53c',
//   'X-RapidAPI-Host':'coinranking1.p.rapidapi.com'
// };

// // // Validate API keys on startup
// // if (!process.env.X_RAPID_API_KEY) {
// //   logError('Missing X_RAPID_API_KEY in environment variables');
// //   process.exit(1);
// // }

// const notificationCache = new Map();
// const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// const checkPriceChanges = async () => {
//   try {
//     logInfo('Starting price monitoring cycle');
    
//     // 1. Fetch current market data with error handling
//     const response = await axios.get(API_URL, {
//       params: { 
//         timePeriod: '3m',
//         limit: 400,
//         orderBy: 'marketCap'
//       },
//       headers: API_HEADERS,
//       timeout: 10000
//     });

//     if (!response.data?.data?.coins) {
//       throw new Error('Invalid API response format');
//     }

//     const coins = response.data.data.coins;
//     const coinMap = new Map(coins.map(coin => [coin.symbol, coin]));
    
//     // 2. Get active assets with thresholds
//     const assets = await Asset.find({ 
//       threshold: { $gt: 0 },
//       isActive: true
//     }).lean();

//     logInfo(`Checking ${assets.length} assets against market data`);

//     // 3. Process assets with error handling
//     const BATCH_SIZE = 10;
//     for (let i = 0; i < assets.length; i += BATCH_SIZE) {
//       const batch = assets.slice(i, i + BATCH_SIZE);
      
//       await Promise.all(batch.map(async (asset) => {
//         try {
//           const coin = coinMap.get(asset.symbol);
//           if (!coin || !coin.price) {
//             logError(`Missing price data for ${asset.symbol}`);
//             return;
//           }

//           const currentPrice = parseFloat(coin.price);
//           const basePrice = asset.currentPrice || asset.purchasePrice;
//           const priceChange = ((currentPrice - basePrice) / basePrice) * 100;

//           // Check threshold and notification cache
//           const cacheKey = `${asset.userId}_${asset.symbol}`;
//           const shouldNotify = Math.abs(priceChange) >= asset.threshold && 
//             (!notificationCache.get(cacheKey) || 
//              Date.now() - notificationCache.get(cacheKey) > CACHE_TTL);

//           if (shouldNotify) {
//             const user = await User.findById(asset.userId).select('fcmToken');
//             if (user?.fcmToken) {
//               logInfo(`Alerting ${asset.symbol} (${priceChange.toFixed(2)}%) to user ${asset.userId}`);
              
//               const success = await sendPriceAlertNotification(
//                 user.fcmToken,
//                 asset.name,
//                 currentPrice,
//                 priceChange
//               );

//               if (success) {
//                 // Update cache and asset
//                 notificationCache.set(cacheKey, Date.now());
//                 await Asset.updateOne(
//                   { _id: asset._id },
//                   { 
//                     currentPrice,
//                     lastNotifiedAt: new Date(),
//                     $inc: { notificationCount: 1 } 
//                   }
//                 );
//               }
//             }
//           }
//         } catch (error) {
//           logError(`Error processing asset ${asset.symbol}:`, error.message);
//         }
//       }));

//       // Rate limiting between batches
//       if (i + BATCH_SIZE < assets.length) {
//         await new Promise(resolve => setTimeout(resolve, 500));
//       }
//     }
//   } catch (error) {
//     logError('Price monitoring failed:', error.message);
//     if (error.response?.status === 401) {
//       logError('Invalid API credentials - please check X_RAPIDAPI_KEY');
//     }
//   }
// };

// // Monitoring control
// let monitoringInterval;
// const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// export const startMonitoring = () => {
//   if (!monitoringInterval) {
//     logInfo('Starting price monitoring service');
//     checkPriceChanges(); // Initial run
//     monitoringInterval = setInterval(checkPriceChanges, CHECK_INTERVAL);
//   }
// };

// export const stopMonitoring = () => {
//   if (monitoringInterval) {
//     clearInterval(monitoringInterval);
//     monitoringInterval = null;
//     logInfo('Price monitoring stopped');
//   }
// };

// // Initialize
// startMonitoring();

// // Cache cleanup
// setInterval(() => {
//   const now = Date.now();
//   notificationCache.forEach((timestamp, key) => {
//     if (now - timestamp > CACHE_TTL) {
//       notificationCache.delete(key);
//     }
//   });
// }, 60 * 60 * 1000); // Hourly cleanup










// services/priceMonitor.js

import Asset from './../models/Asset.js';
import User from './../models/User.js';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import axios from 'axios';

// Get current module path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account file
const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath));

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Track previous prices (in memory)
const priceHistory = new Map();
const COINRANKING_API_URL = 'https://coinranking1.p.rapidapi.com/coins?limit=1000';

const fetchLatestPrices = async () => {
  try {
    const response = await axios.get(COINRANKING_API_URL, {
      headers: {
        'X-RapidAPI-Key': 'db6f4c8bdbmsh7c06f5ac4f1e1ebp1e8908jsn4f501d04c53c',
        'X-RapidAPI-Host': 'coinranking1.p.rapidapi.com'
      }
    });
    
    return response.data.data.coins.reduce((map, coin) => {
      map[coin.symbol] = parseFloat(coin.price);
      return map;
    }, {});
  } catch (error) {
    console.error('Failed to fetch latest prices:', error);
    return null;
  }
};

const updateAssetPrices = async (latestPrices) => {
  if (!latestPrices) return;

  const assets = await Asset.find({});
  const updatePromises = assets.map(async (asset) => {
    const newPrice = latestPrices[asset.symbol];
    if (newPrice && newPrice !== asset.currentPrice) {
      asset.currentPrice = newPrice;
      asset.lastPriceUpdate = new Date();
      await asset.save();
    }
  });

  await Promise.all(updatePromises);
};

const checkPriceAndNotify = async () => {
  try {
    const latestPrices = await fetchLatestPrices();
    await updateAssetPrices(latestPrices);

    const assets = await Asset.find({});
    for (const asset of assets) {
      const prevPrice = priceHistory.get(asset.id) || asset.purchasePrice;
      const currentPrice = asset.currentPrice || asset.purchasePrice;

      if (currentPrice !== prevPrice) {
        const user = await User.findById(asset.userId);
        if (!user || !user.fcmTokens?.length) continue;

        const isIncrease = currentPrice > prevPrice;

        try {
          await admin.messaging().sendEachForMulticast({
            notification: {
              title: `🔄 ${asset.symbol} Price ${isIncrease ? 'Increase' : 'Decrease'}`,
              body: `${asset.name} is now $${currentPrice.toFixed(2)}`
            },
            data: {
              assetId: asset.id,
              symbol: asset.symbol,
              currentPrice: currentPrice.toFixed(2),
              previousPrice: prevPrice.toFixed(2),
              direction: isIncrease ? 'up' : 'down',
              source: 'market'
            },
            tokens: user.fcmTokens
          });

          await Asset.findByIdAndUpdate(asset.id, {
            lastNotifiedAt: new Date(),
            lastNotificationType: isIncrease ? 'price_increase' : 'price_decrease'
          });
        } catch (fcmError) {
          console.error('FCM Error:', fcmError.message);
        }
      }

      priceHistory.set(asset.id, currentPrice);
    }
  } catch (error) {
    console.error('Price monitoring error:', error);
  }
};

export { checkPriceAndNotify };
