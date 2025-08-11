import User from '../models/User.js';
import AppError from '../config/appError.js';
import sendEmail from '../config/email.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
            userId: user._id // Explicitly include userId

    }
  });
};

export const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return next(new AppError('Username is already taken', 400));
      }
      if (existingUser.email === email) {
        return next(new AppError('Email is already in use', 400));
      }
    }

    const newUser = await User.create({
      username,
      email,
      password
    });

    // Generate verification code
    const verificationCode = newUser.createVerificationCode();
    await newUser.save({ validateBeforeSave: false });

    // Send verification email
    const message = `Your verification code is: ${verificationCode}\nThis code will expire in 10 minutes.`;
    
    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Your account verification code',
        message
      });

      res.status(201).json({
        status: 'success',
        message: 'Verification code sent to email!'
      });
    } catch (err) {
      newUser.verificationCode = undefined;
      newUser.verificationCodeExpires = undefined;
      await newUser.save({ validateBeforeSave: false });

      return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const hashedCode = crypto.createHash('sha256').update(req.body.code).digest('hex');
    
    const user = await User.findOne({
      verificationCode: hashedCode,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Verification code is invalid or has expired', 400));
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) Check if user is verified
    if (!user.isVerified) {
      return next(new AppError('Please verify your email first', 401));
    }

    // 4) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  let user; // Declare user variable at the start
  
  try {
    // 1) Get user based on email
    user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('No user found with this email', 404));
    }

    // 2) Generate the random reset token
    const resetOTP = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try {
      const message = `Your password reset OTP is: ${resetOTP}\nThis code expires in 10 minutes.`;

      await sendEmail({
        email: user.email,
        subject: 'Your Password Reset OTP',
        message
      });

      res.status(200).json({
        status: 'success',
        message: 'OTP sent to email!'
      });

    } catch (emailErr) {
      // If email sending fails, clear the reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new AppError(
        'There was an error sending the email. Please try again later.', 
        500
      ));
    }

  } catch (err) {
    // Handle any other errors
    next(err);
  }
};
export const resetPassword = async (req, res, next) => {
  try {
    // 1) Get token from Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.body.tempToken) {
      token = req.body.tempToken; // Fallback for backward compatibility
    }

    if (!token) {
      return next(new AppError('Please provide the authentication token', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Get user and update password
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.password = req.body.password;
    await user.save();

    // 4) Send new auth token
    createSendToken(user, 200, res);
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please request a new password reset', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please request a new password reset', 401));
    }
    next(err);
  }
};

export const verifyResetCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    
    // Hash the incoming OTP to compare with stored hash
    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Invalid or expired OTP', 400));
    }

    // Generate temporary token
    const tempToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Clear the OTP
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      tempToken,
      message: 'OTP verified successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Get user details by ID
export const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -__v');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const { newUsername, currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    // Validate user exists
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    let usernameChanged = false;
    let passwordChanged = false;

    // Handle username update if provided and different from current
    if (newUsername && newUsername !== user.username) {
      // Validate username format
      if (newUsername.length < 3) {
        return next(new AppError('Username must be at least 3 characters', 400));
      }

      // Check username availability
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser) {
        return next(new AppError('Username is already taken', 400));
      }

      user.username = newUsername;
      usernameChanged = true;
    }

    // Handle password update if provided
    if (newPassword) {
      // Validate password strength
      if (newPassword.length < 6) {
        return next(new AppError('Password must be at least 6 characters', 400));
      }

      if (!currentPassword) {
        return next(new AppError('Current password is required to change password', 400));
      }
      
      // Verify current password
      console.log('Verifying current password:', {
        currentPassword,
        storedPassword: user.password,
        isCorrect: await user.correctPassword(currentPassword, user.password)
      });
      if (!(await user.correctPassword(currentPassword, user.password))) {
        return next(new AppError('Current password is incorrect', 401));
      }
      
      user.password = newPassword;
      passwordChanged = true;
    }

    // Check if any updates were requested
    if (!usernameChanged && !passwordChanged) {
      return next(new AppError('No changes were made', 400));
    }

    // Save the user to trigger pre('save') hook for password hashing
    console.log('Before save - new password (pre-hash):', newPassword || 'No password change');
    const updatedUser = await user.save();
    console.log('After save - hashed password:', updatedUser.password);

    // Prepare response data
    const responseData = {
      status: 'success',
      data: {
        user: updatedUser,
        changes: {
          username: usernameChanged,
          password: passwordChanged
        }
      }
    };

    // Log password update for debugging
    if (passwordChanged) {
      console.log('Password updated for user:', userId);
      createSendToken(updatedUser, 200, res, responseData);
    } else {
      res.status(200).json(responseData);
    }

  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new AppError(messages.join(', '), 400));
    }
    next(err);
  }
};



// In userController.js
// userController.js
export const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    console.log('🔔 Received FCM token:', fcmToken);

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    // Verify authorization
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Update user document - critical changes here:
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $addToSet: { fcmTokens: fcmToken } },  // Adds token if not already present
      { 
        new: true,
        upsert: false,
        projection: { fcmTokens: 1 }  // Only return the tokens field
      }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('📝 Updated user tokens:', user.fcmTokens);
    res.json({ 
      success: true,
      tokens: user.fcmTokens 
    });

  } catch (error) {
    console.error('🚨 FCM update error:', error);
    res.status(500).json({ 
      error: 'Failed to update FCM token',
      details: error.message 
    });
  }
};