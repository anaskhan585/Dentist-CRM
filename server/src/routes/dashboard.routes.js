import { Router } from 'express';
import { getActivity, getOverview, getReports } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/overview', getOverview);
router.get('/activity', getActivity);
router.get('/reports', getReports);

export default router;
