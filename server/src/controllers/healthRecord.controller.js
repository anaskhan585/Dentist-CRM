import { z } from 'zod';
import { HealthRecord } from '../models/HealthRecord.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, meta, paginate } from '../utils/query.js';

export const healthRecordSchema = z.object({
  patient: z.string().min(1, 'Choose a patient'),
  appointment: z.string().optional().or(z.literal('')),
  recordType: z.enum(['clinical-note', 'diagnosis', 'prescription', 'x-ray', 'treatment-plan', 'referral']).optional(),
  title: z.string().min(1, 'Give this record a title'),
  chiefComplaint: z.string().optional(),
  findings: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentDone: z.string().optional(),
  plan: z.string().optional(),
  teeth: z.array(z.number().int()).optional(),
  prescriptions: z
    .array(
      z.object({
        drug: z.string(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional(),
      })
    )
    .optional(),
  attachments: z
    .array(z.object({ label: z.string(), kind: z.enum(['x-ray', 'photo', 'document', 'scan']).optional(), url: z.string().optional() }))
    .optional(),
  recordedAt: z.coerce.date().optional(),
});

export const listHealthRecords = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};

  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.recordType) filter.recordType = req.query.recordType;
  if (req.query.author) filter.author = req.query.author;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ title: rx }, { diagnosis: rx }, { chiefComplaint: rx }, { treatmentDone: rx }];
  }

  const [items, total] = await Promise.all([
    HealthRecord.find(filter)
      .populate('patient', 'firstName lastName fileNo')
      .populate('author', 'name colour avatarInitials')
      .sort(req.query.sort ?? '-recordedAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    HealthRecord.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: meta({ page, limit, total }) });
});

export const getHealthRecord = asyncHandler(async (req, res) => {
  const record = await HealthRecord.findById(req.params.id)
    .populate('patient', 'firstName lastName fileNo allergies medicalConditions')
    .populate('author', 'name colour avatarInitials')
    .lean();
  if (!record) throw ApiError.notFound('Record not found');
  res.json({ success: true, data: record });
});

export const createHealthRecord = asyncHandler(async (req, res) => {
  const payload = { ...req.body, author: req.user._id };
  if (!payload.appointment) delete payload.appointment;
  const record = await HealthRecord.create(payload);
  const populated = await record.populate([
    { path: 'patient', select: 'firstName lastName fileNo' },
    { path: 'author', select: 'name colour avatarInitials' },
  ]);
  res.status(201).json({ success: true, data: populated });
});

export const updateHealthRecord = asyncHandler(async (req, res) => {
  const record = await HealthRecord.findById(req.params.id);
  if (!record) throw ApiError.notFound('Record not found');

  // Clinical notes are legal documents — only the author or an admin may revise them.
  const isOwner = record.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('Only the author or an administrator can edit this record');
  }

  Object.assign(record, req.body);
  await record.save();
  res.json({ success: true, data: record });
});

export const deleteHealthRecord = asyncHandler(async (req, res) => {
  const record = await HealthRecord.findByIdAndDelete(req.params.id);
  if (!record) throw ApiError.notFound('Record not found');
  res.json({ success: true, message: 'Record deleted' });
});
