import mongoose from 'mongoose';
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
    // Editing an invoice upwards can take it back out of "paid"; the date follows.
    if (invoice.status !== 'paid') invoice.paidAt = undefined;
  }
  await invoice.save();

  const outstanding = await Invoice.find({
    patient: invoice.patient,
    status: { $in: ['unpaid', 'partial'] },
  }).lean({ virtuals: true });

  const balance = outstanding.reduce((sum, doc) => sum + (doc.balance ?? 0), 0);
  await Patient.findByIdAndUpdate(invoice.patient, { balance: Math.round(balance * 100) / 100 });
}

/**
 * Totals over the whole filtered set, not just the page on screen — a billing
 * overview that only adds up 20 rows is worse than no number at all.
 * The arithmetic mirrors the `subtotal`/`total`/`balance` virtuals on the model.
 */
async function summarise(filter) {
  const [row] = await Invoice.aggregate([
    { $match: filter },
    {
      $addFields: {
        _subtotal: {
          $reduce: {
            input: { $ifNull: ['$items', []] },
            initialValue: 0,
            in: {
              $add: [
                '$$value',
                {
                  $subtract: [
                    { $multiply: [{ $ifNull: ['$$this.quantity', 1] }, { $ifNull: ['$$this.unitPrice', 0] }] },
                    { $ifNull: ['$$this.discount', 0] },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    { $addFields: { _total: { $multiply: ['$_subtotal', { $add: [1, { $divide: [{ $ifNull: ['$taxRate', 0] }, 100] }] }] } } },
    {
      $group: {
        _id: null,
        billed: { $sum: { $cond: [{ $eq: ['$status', 'void'] }, 0, '$_total'] } },
        collected: { $sum: '$amountPaid' },
        outstanding: {
          $sum: { $cond: [{ $in: ['$status', ['unpaid', 'partial']] }, { $subtract: ['$_total', '$amountPaid'] }, 0] },
        },
      },
    },
  ]);

  const round = (value) => Math.round((value ?? 0) * 100) / 100;
  return { billed: round(row?.billed), collected: round(row?.collected), outstanding: round(row?.outstanding) };
}

export const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.patient) {
    if (!mongoose.isValidObjectId(req.query.patient)) throw ApiError.badRequest('Invalid patient id');
    // Cast it here: find() would do this itself, but the aggregate in
    // summarise() gets no schema casting and a string would match nothing.
    filter.patient = new mongoose.Types.ObjectId(req.query.patient);
  }
  if (req.query.from || req.query.to) {
    filter.issuedAt = {};
    if (req.query.from) filter.issuedAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.issuedAt.$lte = new Date(req.query.to);
  }
  if (req.query.search) filter.invoiceNo = new RegExp(escapeRegex(req.query.search), 'i');

  const [items, total, summary] = await Promise.all([
    Invoice.find(filter)
      .populate('patient', 'firstName lastName fileNo phone')
      .populate('dentist', 'name colour avatarInitials')
      .sort(req.query.sort ?? '-issuedAt')
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Invoice.countDocuments(filter),
    summarise(filter),
  ]);

  res.json({ success: true, data: items, meta: { ...meta({ page, limit, total }), summary } });
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

  const patch = { ...req.body };
  // A cleared picker arrives as '', which would never cast to an ObjectId.
  for (const key of ['dentist', 'appointment']) {
    if (patch[key] === '') patch[key] = undefined;
  }
  // The number is the practice's audit trail; it is not editable.
  delete patch.invoiceNo;

  Object.assign(invoice, patch);
  await reconcile(invoice);

  const populated = await invoice.populate([
    { path: 'patient', select: 'firstName lastName fileNo phone' },
    { path: 'dentist', select: 'name colour avatarInitials' },
  ]);
  res.json({ success: true, data: populated });
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
