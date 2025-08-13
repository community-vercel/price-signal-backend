import express from 'express';
import {
  signup,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  verifyResetCode,
  getUserDetails,
  updateUserProfile,
  updateFcmToken,
  verifyToken,
} from './../controller/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.patch('/reset-password', resetPassword);
router.get('/get/:id', getUserDetails);
router.patch('/update/:id', updateUserProfile);
router.put('/update-fcm-token', updateFcmToken);
router.get('/verify-token',verifyToken)
// router.get('/get-fcm-token', getFcmTokens)


export default router;