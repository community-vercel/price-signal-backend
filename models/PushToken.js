import mongoose from 'mongoose';

const pushTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expoPushToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceId: String, // Optional: to identify multiple devices
  platform: {
    type: String,
    enum: ['ios', 'android'],
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('PushToken', pushTokenSchema);