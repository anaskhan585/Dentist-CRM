import { Router } from 'express';
import {
  createHealthRecord,
  deleteHealthRecord,
  getHealthRecord,
  healthRecordSchema,
  listHealthRecords,
  updateHealthRecord,
} from '../controllers/healthRecord.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router
  .route('/')
  .get(listHealthRecords)
  .post(authorize('admin', 'dentist', 'hygienist'), validate(healthRecordSchema), createHealthRecord);

router
  .route('/:id')
  .get(getHealthRecord)
  .patch(authorize('admin', 'dentist', 'hygienist'), validate(healthRecordSchema.partial()), updateHealthRecord)
  .delete(authorize('admin'), deleteHealthRecord);

export default router;
