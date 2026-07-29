import { Router } from 'express';
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  invoiceSchema,
  listInvoices,
  recordPayment,
  updateInvoice,
  updateInvoiceSchema,
} from '../controllers/invoice.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.route('/').get(listInvoices).post(validate(invoiceSchema), createInvoice);
router.post('/:id/payments', recordPayment);
router
  .route('/:id')
  .get(getInvoice)
  .patch(validate(updateInvoiceSchema), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);

export default router;
