import { z } from 'zod';
import { Invoice } from '../models/Invoice.js';
import { Patient } from '../models/Patient.js';
import { Settings } from '../models/Settings.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, meta, paginate } from '../utils/query.js';

export const invoiceSchema = z.object({
  patient: z.string().min(1, 'Choose a patient'),
  dentist: z.string().optional().or(z.literal('')),
  appointment: z.string().optional().or(z.literal('')),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Describe the item'),
        tooth: z.number().int().optional(),
        quantity: z.number().int().min(1).optional(),
        unitPrice: z.number().min(0),
        discount: z.number().min(0).optional(),
      })
    )
    .min(1, 'Add at least one line item'),
  taxRate: z.number().min(0).max(100).optional(),
  amountPaid: z.number().min(0).optional(),
  status: z.enum(['draft', 'unpaid', 'partial', 'paid', 'void']).optional(),
  paymentMethod: z.enum(['cash', 'card', 'bank-transfer', 'insurance', 'other']).optional(),
  dueAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = invoiceSchema.partial();

async function nextInvoiceNo() {
  const settings = await Settings.findOne({ key: 'clinic' }).lean();
  const prefix = `${settings?.billing?.invoicePrefix ?? 'INV'}-${new Date().getFullYear()}-`;
  const last = await Invoice.findOne({ invoiceNo: new RegExp(`^${prefix}`) }).sort({ invoiceNo: -1 }).select('invoiceNo').lean();
  const sequence = last ? Number(last.invoiceNo.split('-').pop()) + 1 : 1;
  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

/** Derives status from what has actually been paid, then syncs the patient balance. */
async function reconcile(invoice) {
  if (invoice.status !== 'void' && invoice.status !== 'draft') {
    if (invoice.amountPaid <= 0) invoice.status = 'unpaid';
    else if (invoice.amountPaid < invoice.total) invoice.status = 'partial';
    else {
      invoice.status = 'paid';
      invoice.paidAt = invoice.paidAt ?? new Date();
    }
  }
  await invoice.save();

  const outstanding = await Invoice.find({
    patient: invoice.patient,
    status: { $in: ['unpaid', 'partial'] },
  }).lean({ virtuals: true });

  const balance = outstanding.reduce((sum, doc) => sum + (doc.balance ?? 0), 0);
  await Patient.findByIdAndUpdate(invoice.patient, { balance: Math.round(balance * 100) / 100 });
}

export const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.from || req.query.to) {
    filter.issuedAt = {};
    if (req.query.from) filter.issuedAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.issuedAt.$lte = new Date(req.query.to);
  }
  if (req.query.search) filter.invoiceNo = new RegExp(escapeRegex(req.query.search), 'i');

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .populate('patient', 'firstName lastName fileNo phone')
      .populate('dentist', 'name colour avatarInitials')
      .sort(req.query.sort ?? '-issuedAt')
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Invoice.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: meta({ page, limit, total }) });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('patient')
    .populate('dentist', 'name colour avatarInitials')
    .lean({ virtuals: true });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  res.json({ success: true, data: invoice });
});

export const createInvoice = asyncHandler(async (req, res) => {
  const payload = { ...req.body, invoiceNo: await nextInvoiceNo() };
  if (!payload.dentist) delete payload.dentist;
  if (!payload.appointment) delete payload.appointment;

  const invoice = await Invoice.create(payload);
  await reconcile(invoice);

  const populated = await invoice.populate({ path: 'patient', select: 'firstName lastName fileNo phone' });
  res.status(201).json({ success: true, data: populated });
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw ApiError.notFound('Invoice not found');
  Object.assign(invoice, req.body);
  await reconcile(invoice);
  res.json({ success: true, data: invoice });
});

export const recordPayment = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw ApiError.badRequest('Enter a payment amount');

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw ApiError.notFound('Invoice not found');
  if (invoice.status === 'void') throw ApiError.badRequest('This invoice has been voided');
  if (amount > invoice.balance + 0.01) throw ApiError.badRequest('Payment exceeds the outstanding balance');

  invoice.amountPaid += amount;
  if (req.body.paymentMethod) invoice.paymentMethod = req.body.paymentMethod;
  await reconcile(invoice);

  res.json({ success: true, data: invoice });
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw ApiError.notFound('Invoice not found');
  invoice.status = 'void';
  await reconcile(invoice);
  res.json({ success: true, message: 'Invoice voided', data: invoice });
});
