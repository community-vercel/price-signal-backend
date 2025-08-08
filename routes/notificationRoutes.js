import express from 'express';
import { registerToken } from '../controller/notificationController.js';
import admin from 'firebase-admin';


const router = express.Router();

router.post('/register', registerToken);

export default router;