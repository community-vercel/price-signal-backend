import Asset from './../models/Asset.js';
import User from './../models/User.js';
import Notification from './../models/Notification.js'; // Add this import
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();


// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase

const serviceAccount = {
  projectId:'price-signal-app',
  privateKey:"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcBxEvuhsW1PEd\nPHaRrwzMUstmOhOSHUWnmBlz/GmU3FCchAMBDEF0Rb4EALzkILDJ6DHE4B8PecSd\nieR5JnuXBlQ43WX3EC49ylfsuVlSzYtBFsd9BMKdTcs5uZnr4tlko2sr15DcMF48\nDRZ/t9lx+XvNXUVQswcNdV7rK4dOyxZcf147F/zyvdNMAd1wi5Isg2ta4tDjzoIn\nw9TZ391jh+k7hhAbUwKxIdp8+g+QORFyhQngFhFwIPLtqVae4Ct9r/oJku8RLKTv\nz12T5r5wBAsChaFYimJcpL11AfCyxRgcG5nZlc9tOFopuuiaH+u+o1FmOgOu8vLD\n6j0p+MLbAgMBAAECggEAXZ10JoZceD5pyDKtkBaWr2iauggDw6tIs6H3Um4Wzgtf\nEPjp/kwknT//NNzLgZSXI5Dze/yPupnomc7Nsu44r2018GvislfkFM4+0q2Z360s\njqkOf5bC5wLucMUTRFXkgPk25BR3wfeiYJKA/B5RGjk3/4yrrUY+ve8uT4jZrR/Z\nkNY6fsMSj7onV4TJPN3LHdmpxWoUxOZFX5+D9idzBD9hcrQdAzQFvpnyen1EtDak\nHXL2P2RP0bYlyGcasBV1wngmIDD7xp38xnCmfI54XdY7s6P3fd6BZ/soFg0cGOsH\nbT+VQepsfb7mVzi3ArPtkPpCjqnd6BOrtKUTY7nkoQKBgQDvE/cxRJ1ULIflq4fe\nHMfJ+PDciDoVFUqxh/GZuMDHZoF+bTbBg8k0i5/kTpfjyViAOSqj8EesHI84Lnii\nBevamrW61JIBY0hPQaeT26i1UxzMKABFZRa6aTpiKzdGYiaI50MgyidLN+O9xej9\nCcsVKD15Fcu41kitm3ofo4XWHwKBgQDrmenLAw+ZEU3FNzBcE2WyR9+bgEC2YYc1\nmMMazBydWq9UftzEz7dCpXSVmBzq8jeP+X/SgbjiDs3/XBoXky/5jwKKfLuhoOAn\nXjHzrwQTy/DQ9aA/sZaM03X164xJ+GrZdXz4spjyYKIYyjbHgbA9oCGUg5U20Gyv\nzOEA1jNjxQKBgQDu36sHfgAYX1n1HzrksSrp4aJ/JlmqQRjdYvAB4Lg1Q3U1Jdgk\n6BD8QFmkmuZmQQH9M6EoJebmz65FuyDq+jGavSPApa2wV0ujbP0L3dimO4G1dm42\n5/cakBM2jOlwmJbaCP9oXrN+Ezyom3rcgJF59TfeqOlhKDF7zLHrtM3/jwKBgFXu\n7bd+hlHuXc9xMdJjwNQmIwk03mWnbQm/jmpXyJgcW5cWLrAak11bvApUUTfg4SNC\nfbzqU+UgQULC9UFkDjuYTfT1SfrKEvhJAy8+xt3xpQSSksCopaD4AC6Sm7jfQxnO\nIKcVfXPqizU/jHt4cjAIGDdzRxmXLA1zTR5hAp2BAoGACjlRmX8e7NIPmuR0orBE\n7WPS5b8eeP2lMBsIOQqbl+P5PNiFiXPMW+Uq0GtJVC/wKRrPRZcOEY5kspJtAQb1\n8UNQbnaT8BtSUuaRsePun5CbIQ3jFZf1hEWiBLh+UQO2WNYSzj1SDjhaq2/kDEBn\nrgKu3KcUOwn4ed+xKZXs6jI=\n-----END PRIVATE KEY-----\n",
  clientEmail:'firebase-adminsdk-fbsvc@price-signal-app.iam.gserviceaccount.com' ,
  clientId:'103045196354658690529' ,
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized for project:', serviceAccount.projectId);
  } catch (error) {
    console.error('🚨 Firebase Admin SDK initialization failed:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Store prices to prevent repeated notifications
const priceHistory = new Map();
const recentlyUpdated = new Set();
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
    console.error('❌ Failed to fetch latest prices:', error.message);
    return null;
  }
};

const updateAssetPrices = async (latestPrices) => {
  if (!latestPrices) return;

  const assets = await Asset.find({});
  const updatePromises = assets.map(async (asset) => {
    const newPrice = latestPrices[asset.symbol];
    if (!newPrice) {
      console.warn(`⚠️ No price data for ${asset.symbol}`);
      return;
    }

    const prevPrice = asset.currentPrice ?? asset.purchasePrice;
    const priceChanged = newPrice !== asset.currentPrice;
    
    if (!priceChanged) {
      return; // Skip if price hasn't changed
    }

    // Calculate changes
    const priceDifference = newPrice - prevPrice;
    const changePercent = Math.abs(priceDifference / prevPrice) * 100;
    const direction = priceDifference >= 0 ? '↑' : '↓';
    
    // Calculate value and amount changes
    const currentValue = asset.amount * prevPrice;
    const newAmount = currentValue / newPrice;
    const amountDifference = newAmount - asset.amount;
    const valueDifference = (newAmount * newPrice) - currentValue;

    // Detailed logging
    console.log(`\n🔔 ${asset.name || asset.symbol} (${asset.symbol})`);
    console.log(`💰 Price: $${prevPrice.toFixed(2)} → $${newPrice.toFixed(2)} (${direction} ${changePercent.toFixed(2)}%)`);
    console.log(`📊 Amount: ${asset.amount.toFixed(8)} → ${newAmount.toFixed(8)} (${amountDifference >= 0 ? '+' : ''}${amountDifference.toFixed(8)})`);
    console.log(`💵 Value: $${currentValue.toFixed(2)} → $${(newAmount * newPrice).toFixed(2)} (${valueDifference >= 0 ? '+' : ''}${valueDifference.toFixed(2)})`);

    // Update asset in database
    const updateData = {
      currentPrice: newPrice,
      amount: newAmount,
      lastApiPriceUpdate: new Date(),
      $push: {
        priceHistory: {
          price: newPrice,
          timestamp: new Date(),
          changePercent: parseFloat(changePercent.toFixed(4))
        }
      }
    };

    await Asset.updateOne(
      { _id: asset._id },
      { $set: updateData }
    );

    recentlyUpdated.add(String(asset._id));

    // Check if threshold was crossed (either direction)
    if (changePercent >= asset.priceChangeThreshold) {
      await sendPriceNotification(asset, prevPrice, newPrice);
      priceHistory.set(asset._id, newPrice);
      
      // Additional check for significant thresholds
      if (changePercent >= asset.priceChangeThreshold * 2) {
        console.log(`🚨 Significant price change for ${asset.symbol}!`);
        await sendUrgentPriceAlert(asset, prevPrice, newPrice);
      }
    }

    // Track daily high/low
    await trackDailyHighLow(asset, newPrice);
  });

  await Promise.all(updatePromises);
  console.log('\n✅ Completed price updates for all assets');
};

// Helper function to track daily highs/lows
const trackDailyHighLow = async (asset, newPrice) => {
  const today = new Date().toISOString().split('T')[0];
  const update = {};
  
  if (!asset.dailyHigh || newPrice > asset.dailyHigh.price) {
    update.dailyHigh = {
      price: newPrice,
      timestamp: new Date()
    };
  }
  
  if (!asset.dailyLow || newPrice < asset.dailyLow.price) {
    update.dailyLow = {
      price: newPrice,
      timestamp: new Date()
    };
  }

  if (Object.keys(update).length > 0) {
    await Asset.updateOne(
      { _id: asset._id },
      { $set: update }
    );
  }
};

// New function for urgent alerts
const sendUrgentPriceAlert = async (asset, prevPrice, newPrice) => {
  const changePercent = Math.abs((newPrice - prevPrice) / prevPrice) * 100;
  const direction = newPrice > prevPrice ? 'increased' : 'decreased';
  
  const notification = {
    userId: asset.userId,
    type: 'urgent_price_alert',
    message: `URGENT: ${asset.symbol} price ${direction} by ${changePercent.toFixed(2)}% ($${prevPrice.toFixed(2)} → $${newPrice.toFixed(2)})`,
    assetName: asset.name || asset.symbol,
    symbol: asset.symbol,
    prevPrice,
    currentPrice: newPrice,
    timestamp: new Date()
  };

  await Notification.create(notification);
  console.log(`🚨 Sent urgent alert for ${asset.symbol}`);
};
const watchAssetChanges = () => {
  Asset.watch().on('change', async (change) => {
    if (change.operationType === 'update' && change.updateDescription.updatedFields.currentPrice) {
      const assetId = String(change.documentKey._id);

      if (recentlyUpdated.has(assetId)) {
        recentlyUpdated.delete(assetId);
        return;
      }

      const asset = await Asset.findOne({ _id: assetId });
      if (!asset) return;

      const prevPrice = priceHistory.get(asset._id) ?? asset.purchasePrice;
      const currentPrice = asset.currentPrice;

      if (currentPrice !== prevPrice) {
        await sendPriceNotification(asset, prevPrice, currentPrice);
        priceHistory.set(asset._id, currentPrice);
      }
    }
  });
};

const sendPriceNotification = async (asset, prevPrice, currentPrice) => {
  
  const user = await User.findOne({ _id: asset.userId });
  if (!user || !user.fcmTokens?.length) {
    console.log('🔔 No user or FCM tokens found for userId:', asset.userId);
    return;
  }
  
  const isIncrease = currentPrice > prevPrice;
  const title = `${asset.symbol} Price ${isIncrease ? 'Up' : 'Down'}`;
  const body = `${asset.name}: $${prevPrice.toFixed(2)} → $${currentPrice.toFixed(2)}`;

  // Save notification to database
  try {
    await Notification.create({
      userId: asset.userId,
      title,
      body,
      assetId: String(asset._id),
      assetName: asset.name || asset.symbol, // ✅ FIX
      symbol: asset.symbol,
      prevPrice,
      currentPrice,
      changePercent: Math.abs((currentPrice - prevPrice) / prevPrice) * 100,
      isIncrease
    });
    console.log('📝 Notification saved to database');
  } catch (error) {
    console.error('❌ Failed to save notification:', error);
  }

  const message = {
    notification: { title, body },
    data: {
      assetId: String(asset._id),
      notificationType: 'price_alert'
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'price_alerts',
        sound: 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          category: 'PRICE_ALERT'
        }
      }
    },
    tokens: user.fcmTokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`📢 Notification sent to ${user.fcmTokens.length} device(s):`, JSON.stringify(response, null, 2));
    if (response.responses) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (resp.error) {
          console.error(`🚨 FCM error for token ${user.fcmTokens[idx]}:`, {
            code: resp.error.code,
            message: resp.error.message,
            details: resp.error.details
          });
          if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(resp.error.code)) {
            invalidTokens.push(user.fcmTokens[idx]);
          }
        }
      });
      if (invalidTokens.length > 0) {
        await User.updateOne(
          { _id: asset.userId },
          { $pull: { fcmTokens: { $in: invalidTokens } } }
        );
        console.log('🗑️ Removed invalid FCM tokens:', invalidTokens);
      }
    }
  } catch (error) {
    console.error('🚨 FCM Error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack
    });
  }
};

// Add this new function to get recent notifications
const getRecentNotifications = async (userId, days = 10, limitPerDay = 20) => {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const notifications = await Notification.find({
      userId,
      timestamp: { $gte: dateThreshold } // Changed from createdAt to timestamp
    })
    .sort({ timestamp: -1 }) // Changed from createdAt to timestamp
    .limit(100);

    // Group by day
    const groupedByDay = notifications.reduce((acc, notification) => {
      const dateStr = new Date(notification.timestamp).toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      // Map to the expected frontend format
     acc[dateStr].push({
  title: `${notification.assetName || notification.symbol} Price Update`,
  body: notification.message || notification.body,
  assetId: notification.assetId,
  assetName: notification.assetName || notification.symbol, // ✅ FIX
  symbol: notification.symbol,
  prevPrice: notification.prevPrice || 0,
  currentPrice: notification.currentPrice || 0,
  timestamp: notification.timestamp
});
      
      return acc;

    }, {});

    // Format the response
    return Object.entries(groupedByDay)
      .sort((a, b) => new Date(b[0]) - new Date(a[0])) // Sort by date descending
      .slice(0, days) // Only requested days
      .map(([date, dayNotifications]) => ({
        date,
        notifications: dayNotifications.slice(0, limitPerDay) // Limit per day
      }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

const checkPriceAndUpdate = async () => {
  try {
    const latestPrices = await fetchLatestPrices();
    await updateAssetPrices(latestPrices);
  } catch (error) {
    console.error('❌ Price monitoring error:', error.message);
  }
};

const startPriceMonitoring = () => {
  checkPriceAndUpdate(); // Initial run
  watchAssetChanges();   // Listen for DB changes & send notifications
  setInterval(checkPriceAndUpdate, 3600 * 1000); // Poll every 30s
};

// Export the new function along with the existing one
export { startPriceMonitoring, getRecentNotifications };