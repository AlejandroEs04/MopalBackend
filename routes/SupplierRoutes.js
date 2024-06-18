import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import { addNewSupplier, getAllSupplier } from '../controllers/SupplierController.js';

const router = express.Router();

router.route('/').get(checkAuth, getAllSupplier).post(checkAuth, addNewSupplier);

export default router