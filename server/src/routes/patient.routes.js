import { Router } from 'express';
import {
  createPatient,
  deletePatient,
  getPatient,
  listPatients,
  patientSchema,
  toothChartSchema,
  updatePatient,
  updateToothChart,
} from '../controllers/patient.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.route('/').get(listPatients).post(validate(patientSchema), createPatient);
router
  .route('/:id')
  .get(getPatient)
  .patch(validate(patientSchema.partial()), updatePatient)
  .delete(authorize('admin', 'dentist'), deletePatient);

router.patch('/:id/tooth-chart', authorize('admin', 'dentist', 'hygienist'), validate(toothChartSchema), updateToothChart);

export default router;
