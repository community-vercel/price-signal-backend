// import axios from 'axios';
// import Asset from '../models/Asset.js';
// import PushToken from '../models/PushToken.js'; // Changed from FcmToken to PushToken
// import AppError from '../config/appError.js';
// import cron from 'node-cron';

// // Function to fetch asset prices from CoinRanking API
// const fetchCoinPrices = async () => {
//   try {
//     const response = await axios.get('https://coinranking1.p.rapidapi.com/coins', {
//       headers: {
//         'X-RapidAPI-Key': process.env.COINRANKING_API_KEY,
//         'X-RapidAPI-Host': 'coinranking1.p.rapidapi.com'
//       },
//       params: {
//         timePeriod: '24h',
//         orderBy: 'price',
//         limit: 100
//       }
//     });
//     return response.data.data.coins;
//   } catch (error) {
//     console.error('Error fetching CoinRanking API:', error);
//     throw new AppError('Failed to fetch coin prices', 500);
//   }
// };

// // New: Function to send via Expo Push Service
// const sendExpoPushNotification = async (expoPushToken, title, body) => {
//   const message = {
//     to: expoPushToken,
//     sound: 'default',
//     title,
//     body,
//     data: { type: 'price_alert' }, // Custom data for deep linking
//     priority: 'high' // Important for Android background notifications
//   };

//   try {
//     const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
//       headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/json'
//       }
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error sending Expo push notification:', error);
//     throw error;
//   }
// };

// // Modified endpoint to use Expo instead of FCM
// const checkPriceChanges = async (req, res, next) => {
//   try {
//     const assets = await Asset.find({});
//     if (!assets || assets.length === 0) {
//       return res.status(404).json({ message: 'No assets found in database' });
//     }

//     const coins = await fetchCoinPrices();
//     const userPriceUpdates = {};

//     for (const asset of assets) {
//       const coin = coins.find(c => c.symbol.toLowerCase() === asset.symbol.toLowerCase());
//       if (!coin) {
//         console.warn(`Coin not found for symbol: ${asset.symbol}`);
//         continue;
//       }

//       const newPrice = parseFloat(coin.price);
//       const oldPrice = asset.currentPrice ? parseFloat(asset.currentPrice) : null;

//       if (oldPrice && Math.abs((newPrice - oldPrice) / oldPrice) * 100 > 1) {
//         const changeType = newPrice > oldPrice ? 'increased' : 'decreased';
//         const priceChange = {
//           name: asset.name,
//           symbol: asset.symbol,
//           currentPrice: newPrice,
//           previousPrice: oldPrice,
//           changeType
//         };

//         if (!userPriceUpdates[asset.userId]) {
//           userPriceUpdates[asset.userId] = [];
//         }
//         userPriceUpdates[asset.userId].push(priceChange);

//         await Asset.findOneAndUpdate(
//           { id: asset.id },
//           { currentPrice: newPrice },
//           { new: true }
//         );
//       }
//     }

//     // Modified notification sending logic
//     for (const userId in userPriceUpdates) {
//       const priceChanges = userPriceUpdates[userId];
//       const tokenDoc = await PushToken.findOne({ userId }); // Now using PushToken model
      
//       if (!tokenDoc) {
//         console.warn(`No Expo push token found for user: ${userId}`);
//         continue;
//       }

//       try {
//         // Send one consolidated notification per user
//         const topChange = priceChanges.reduce((prev, current) => 
//           (prev.currentPrice - prev.previousPrice) > (current.currentPrice - current.previousPrice) 
//             ? prev 
//             : current
//         );

//         await sendExpoPushNotification(
//           tokenDoc.expoPushToken,
//           `${topChange.name} Price ${topChange.changeType}`,
//           `${topChange.symbol} changed by ${(
//             Math.abs(topChange.currentPrice - topChange.previousPrice) / topChange.previousPrice * 100
//           ).toFixed(2)}%`
//         );
        
//         console.log(`Expo notification sent to user ${userId}`);
//       } catch (error) {
//         console.error(`Error sending Expo notification to user ${userId}:`, error);
//       }
//     }

//     res.status(200).json({ message: 'Price check completed, Expo notifications sent where applicable' });
//   } catch (error) {
//     console.error('Error in price check:', error);
//     next(new AppError('Failed to check prices or send notifications', 500));
//   }
// };

// // Scheduled task remains the same
// cron.schedule('0 * * * *', async () => {
//   console.log('Running scheduled price check...');
//   try {
//     await checkPriceChanges({ body: {} }, { status: () => ({ json: console.log }) }, console.error);
//     console.log('Scheduled price check completed');
//   } catch (error) {
//     console.error('Error in scheduled price check:', error);
//   }
// });

// export { checkPriceChanges };