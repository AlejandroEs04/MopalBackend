import express from 'express'
import { getCompleteReport } from '../controllers/InventoryReportController.js';

const router = express.Router();

router.get('/', getCompleteReport)

export default router