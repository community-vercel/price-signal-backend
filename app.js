import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRouter from './routes/authRoutes.js';
import AppError from './config/appError.js';
import globalErrorHandler from './controller/errorController.js';
import assetRouter from './routes/assetRoutes.js';
// import { startPriceMonitoring } from './services/priceMonitor.js';
import notificationRoutes from './routes/notificationRoutes.js';



dotenv.config();

const app = express();



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/assets', assetRouter);
// app.use('/api/v1/price-check', priceChekRoutes);
app.use('/api/v1/notifications', notificationRoutes);


// app.use('/api/v1/notifications', notificationRoutes);
// Price check cron job (runs every 30 minutes)
// const priceCheckJob = new cron.CronJob('*/30 * * * *', checkPriceAndNotify);
// priceCheckJob.start();

// app.post('/api/store-expo-token', async (req, res, next) => {
//   try {
//     const { userId, expoPushToken, platform } = req.body;
    
//     // Validation
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: 'Invalid user ID' });
//     }
    
//     if (!expoPushToken?.startsWith('ExponentPushToken')) {
//       return res.status(400).json({ error: 'Invalid Expo token format' });
//     }

//     console.log(`💾 Storing token for user ${userId}`);

//     // Upsert operation
//     const result = await PushToken.findOneAndUpdate(
//       { expoPushToken },
//       {
//         userId,
//         platform,
//         lastUpdated: new Date()
//       },
//       {
//         upsert: true,
//         new: true
//       }
//     );

//     console.log('✅ Storage result:', result);

//     res.status(200).json({
//       success: true,
//       token: result
//     });

//   } catch (error) {
//     console.error('❌ Database error:', error);
//     res.status(500).json({ error: 'Failed to store token' });
//   }
// });

// Error handling for undefined routes
// app.all('*', (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// Global error handler
app.use(globalErrorHandler);

// Local MongoDB Connection
const DB = process.env.MONGO_URI;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to local MongoDB successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));
// startPriceMonitoring
// priceMonitor.start();


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
export default app;