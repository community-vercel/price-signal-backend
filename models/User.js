import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
 fcmTokens: {
    type: [String],
    default: []  // Initialize as empty array
  },
    isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate verification code
userSchema.methods.createVerificationCode = function() {
  const code = crypto.randomInt(100000, 999999).toString();
  this.verificationCode = crypto.createHash('sha256').update(code).digest('hex');
  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return code;
};

// Compare passwords
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Generate password reset token
// Replace createPasswordResetToken method with:
userSchema.methods.createPasswordResetToken = function() {
  // Generate 6-digit OTP
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash and store the OTP
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetCode; // Return the plain OTP
};

export default mongoose.model('User', userSchema);