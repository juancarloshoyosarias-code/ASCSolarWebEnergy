import express from 'express';
import { getPlantsSummary, getPlantDetails, getFinancialHistory, getInvestmentSummary, getGenerationHistory, getEnergyDistribution } from '../controllers/plantController.js';

const router = express.Router();

router.get('/', getPlantsSummary);
router.get('/history', getFinancialHistory);
router.get('/generation-history', getGenerationHistory);
router.get('/energy-distribution', getEnergyDistribution);
router.get('/investment-summary', getInvestmentSummary);
router.get('/:id', getPlantDetails);

export default router;
