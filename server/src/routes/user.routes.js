import { Router } from 'express';
import {
  createUser,
  createUserSchema,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
  updateUserSchema,
} from '../controllers/user.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.route('/').get(listUsers).post(authorize('admin'), validate(createUserSchema), createUser);
router
  .route('/:id')
  .get(getUser)
  .patch(authorize('admin'), validate(updateUserSchema), updateUser)
  .delete(authorize('admin'), deleteUser);

export default router;
