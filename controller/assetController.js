import Asset from '../models/Asset.js';
import { startPriceMonitoring } from '../services/priceMonitor.js';


startPriceMonitoring();

     // Create - Add a new asset
     const addAsset = async (req, res) => {
       try {
         const { symbol, name, amount, purchasePrice, currentPrice, date, exchange, notes, userId } = req.body;

         // Validate required fields
         if (!symbol || !name || !amount || !purchasePrice || !date || !exchange || !userId) {
           return res.status(400).json({ error: 'All required fields must be provided' });
         }

         const newAsset = new Asset({
           id: Date.now().toString(),
           symbol,
           name,
           amount: parseFloat(amount),
           purchasePrice: parseFloat(purchasePrice),
           currentPrice: currentPrice ? parseFloat(currentPrice) : undefined,
           date: new Date(date),
           exchange,
           notes: notes || '',
           userId
         });

         const savedAsset = await newAsset.save();
         res.status(201).json({
           message: `${amount} ${symbol} added to your portfolio`,
           asset: savedAsset,
         });
       } catch (error) {
         res.status(500).json({ error: 'Server error while adding asset' });
       }
     };

     // Read - Get all assets
     const getAllAssets = async (req, res) => {
       try {
         const { userId } = req.query; // Optional: Filter by userId
         const query = userId ? { userId } : {};
         const assets = await Asset.find(query);
         res.status(200).json(assets);
       } catch (error) {
         res.status(500).json({ error: 'Server error while retrieving assets' });
       }
     };

     // Read - Get a single asset by ID
     const getAssetById = async (req, res) => {
       try {
         const { id } = req.params;
         const asset = await Asset.findOne({ id });

         if (!asset) {
           return res.status(404).json({ error: 'Asset not found' });
         }

         res.status(200).json(asset);
       } catch (error) {
         res.status(500).json({ error: 'Server error while retrieving asset' });
       }
     };

     // Update - Update an existing asset
     const updateAsset = async (req, res) => {
       try {
         const { id } = req.params;
         const updateData = req.body;

         // Validate that there's data to update
         if (!updateData || Object.keys(updateData).length === 0) {
           return res.status(400).json({ error: 'No update data provided' });
         }

         // Convert numeric fields if they exist
         if (updateData.amount) {
           updateData.amount = parseFloat(updateData.amount);
         }
         if (updateData.purchasePrice) {
           updateData.purchasePrice = parseFloat(updateData.purchasePrice);
         }
         if (updateData.currentPrice) {
           updateData.currentPrice = parseFloat(updateData.currentPrice);
         }
         if (updateData.date) {
           updateData.date = new Date(updateData.date);
         }

         const updatedAsset = await Asset.findOneAndUpdate(
           { id },
           updateData,
           { new: true, runValidators: true }
         );

         if (!updatedAsset) {
           return res.status(404).json({ error: 'Asset not found' });
         }

         res.status(200).json({
           message: 'Asset updated successfully',
           asset: updatedAsset,
         });
       } catch (error) {
         res.status(500).json({ error: 'Server error while updating asset' });
       }
     };

     // Delete - Remove an asset
     const deleteAsset = async (req, res) => {
       try {
         const { id } = req.params;
         const deletedAsset = await Asset.findOneAndDelete({ id });

         if (!deletedAsset) {
           return res.status(404).json({ error: 'Asset not found' });
         }

         res.status(200).json({
           message: 'Asset deleted successfully',
           asset: deletedAsset,
         });
       } catch (error) {
         res.status(500).json({ error: 'Server error while deleting asset' });
       }
     };

     export {
       addAsset,
       getAllAssets,
       getAssetById,
       updateAsset,
       deleteAsset,
     };