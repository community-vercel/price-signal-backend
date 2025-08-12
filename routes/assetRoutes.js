import express from 'express';
import {
  addAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  deleteAsset
} from './../controller/assetController.js';
import { protect } from '../middlewares/authMiddleware.js'; // Import middleware

const router = express.Router();
router.use(protect);

router.post('/add-asset', addAsset);
router.get('/get-all-assets', getAllAssets);

// New CRUD routes
router.get('/getById/:id', getAssetById);       // Get single asset by ID
router.put('/update/:id', updateAsset);        // Full update
router.patch('/update/:id', updateAsset);      // Partial update
router.delete('/delete/:id', deleteAsset);     // Delete asset
export default router;