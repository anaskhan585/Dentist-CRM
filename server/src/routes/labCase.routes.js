import { Router } from 'express';
import {
  createLabCase,
  deleteLabCase,
  labCaseSchema,
  listLabCases,
  updateLabCase,
  updateLabCaseSchema,
} from '../controllers/labCase.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.route('/').get(listLabCases).post(validate(labCaseSchema), createLabCase);
router
  .route('/:id')
  .patch(validate(updateLabCaseSchema), updateLabCase)
  .delete(authorize('admin', 'dentist'), deleteLabCase);

export default router;
