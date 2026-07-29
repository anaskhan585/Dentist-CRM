import { Router } from 'express';
import {
  createMessage,
  deleteMessage,
  listMessages,
  markRead,
  messageSchema,
  toggleStar,
} from '../controllers/message.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.route('/').get(listMessages).post(validate(messageSchema), createMessage);
router.patch('/:id/read', markRead);
router.patch('/:id/star', toggleStar);
router.delete('/:id', deleteMessage);

export default router;
