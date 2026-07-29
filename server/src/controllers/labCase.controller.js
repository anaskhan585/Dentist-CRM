import { z } from 'zod';
import { LabCase, LAB_STAGES } from '../models/LabCase.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { meta, paginate } from '../utils/query.js';

export const labCaseSchema = z.object({
  patient: z.string().min(1, 'Choose a patient'),
  dentist: z.string().min(1, 'Choose a dentist'),
  lab: z.object({
    name: z.string().min(1, 'Lab name is required'),
    contact: z.string().optional(),
    phone: z.string().optional(),
  }),
  workType: z.enum(['Crown', 'Bridge', 'Veneer', 'Denture', 'Night Guard', 'Aligner', 'Inlay/Onlay', 'Post & Core']),
  shade: z.string().optional(),
  teeth: z.array(z.number().int()).optional(),
  stage: z.enum(LAB_STAGES).optional(),
  dueAt: z.coerce.date(),
  sentAt: z.coerce.date().optional(),
  cost: z.number().min(0).optional(),
  priority: z.enum(['standard', 'urgent']).optional(),
  notes: z.string().optional(),
});

export const updateLabCaseSchema = labCaseSchema.partial();

async function nextCaseNo() {
  const year = new Date().getFullYear();
  const prefix = `LAB-${year}-`;
  const last = await LabCase.findOne({ caseNo: new RegExp(`^${prefix}`) }).sort({ caseNo: -1 }).select('caseNo').lean();
  const sequence = last ? Number(last.caseNo.split('-')[2]) + 1 : 1;
  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

export const listLabCases = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 100 });
  const filter = {};
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.dentist) filter.dentist = req.query.dentist;
  if (req.query.priority) filter.priority = req.query.priority;

  const [items, total] = await Promise.all([
    LabCase.find(filter)
      .populate('patient', 'firstName lastName fileNo')
      .populate('dentist', 'name colour avatarInitials')
      .sort(req.query.sort ?? 'dueAt')
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    LabCase.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: meta({ page, limit, total }) });
});

export const createLabCase = asyncHandler(async (req, res) => {
  const labCase = await LabCase.create({
    ...req.body,
    caseNo: await nextCaseNo(),
    history: [{ stage: req.body.stage ?? 'impression-taken', at: new Date(), by: req.user._id }],
  });
  const populated = await labCase.populate([
    { path: 'patient', select: 'firstName lastName fileNo' },
    { path: 'dentist', select: 'name colour avatarInitials' },
  ]);
  res.status(201).json({ success: true, data: populated });
});

export const updateLabCase = asyncHandler(async (req, res) => {
  const labCase = await LabCase.findById(req.params.id);
  if (!labCase) throw ApiError.notFound('Lab case not found');

  if (req.body.stage && req.body.stage !== labCase.stage) {
    labCase.history.push({ stage: req.body.stage, at: new Date(), by: req.user._id });
    // Keep the milestone timestamps in step with the board.
    if (req.body.stage === 'sent-to-lab' && !labCase.sentAt) labCase.sentAt = new Date();
    if (req.body.stage === 'received' && !labCase.receivedAt) labCase.receivedAt = new Date();
    if (req.body.stage === 'delivered' && !labCase.deliveredAt) labCase.deliveredAt = new Date();
  }

  Object.assign(labCase, req.body);
  await labCase.save();

  const populated = await labCase.populate([
    { path: 'patient', select: 'firstName lastName fileNo' },
    { path: 'dentist', select: 'name colour avatarInitials' },
  ]);
  res.json({ success: true, data: populated });
});

export const deleteLabCase = asyncHandler(async (req, res) => {
  const labCase = await LabCase.findByIdAndDelete(req.params.id);
  if (!labCase) throw ApiError.notFound('Lab case not found');
  res.json({ success: true, message: 'Lab case removed' });
});
