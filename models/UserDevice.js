import mongoose from 'mongoose';

const userDeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fcmToken: { type: String, required: true },
  platform: { type: String, enum: ['android', 'ios'], required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('UserDevice', userDeviceSchema);