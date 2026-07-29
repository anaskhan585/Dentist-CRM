import { Router } from 'express';
import {
  appointmentSchema,
  createAppointment,
  deleteAppointment,
  getAppointment,
  getDaySchedule,
  listAppointments,
  updateAppointment,
  updateAppointmentSchema,
} from '../controllers/appointment.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.get('/day', getDaySchedule);
router.route('/').get(listAppointments).post(validate(appointmentSchema), createAppointment);
router
  .route('/:id')
  .get(getAppointment)
  .patch(validate(updateAppointmentSchema), updateAppointment)
  .delete(authorize('admin', 'dentist'), deleteAppointment);

export default router;
