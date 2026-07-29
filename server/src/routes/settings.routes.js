import { Router } from 'express';
import { getSettings, settingsSchema, updateSettings } from '../controllers/settings.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.get('/', getSettings);
router.patch('/', authorize('admin'), validate(settingsSchema), updateSettings);

export default router;
