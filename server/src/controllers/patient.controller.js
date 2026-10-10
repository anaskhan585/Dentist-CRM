import { z } from 'zod';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { HealthRecord } from '../models/HealthRecord.js';
import { Invoice } from '../models/Invoice.js';
import { LabCase } from '../models/LabCase.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, meta, paginate } from '../utils/query.js';

export const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(6, 'Enter a reachable phone number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'undisclosed']).optional(),
  address: z
    .object({ line1: z.string().optional(), city: z.string().optional(), state: z.string().optional(), postalCode: z.string().optional() })
    .optional(),
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  emergencyContact: z
    .object({ name: z.string().optional(), relation: z.string().optional(), phone: z.string().optional() })
    .optional(),
  insurance: z
    .object({ provider: z.string().optional(), policyNo: z.string().optional(), validTill: z.coerce.date().optional() })
    .optional(),
  primaryDentist: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  notes: z.string().optional(),
});

async function nextFileNo() {
  const year = new Date().getFullYear();
  const prefix = `P-${year}-`;
  const last = await Patient.findOne({ fileNo: new RegExp(`^${prefix}`) })
    .sort({ fileNo: -1 })
    .select('fileNo')
    .lean();
  const sequence = last ? Number(last.fileNo.split('-')[2]) + 1 : 1;
  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

export const listPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};

  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { phone: rx }, { fileNo: rx }, { email: rx }];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.dentist) filter.primaryDentist = req.query.dentist;
  if (req.query.tag) filter.tags = req.query.tag;

  const sort = req.query.sort ?? '-createdAt';

  const [items, total] = await Promise.all([
    Patient.find(filter).populate('primaryDentist', 'name colour avatarInitials').sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
    Patient.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: meta({ page, limit, total }) });
});

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate('primaryDentist', 'name colour avatarInitials specialty')
    .lean({ virtuals: true });
  if (!patient) throw ApiError.notFound('Patient not found');

  // Billing is administrator-only, so the file simply carries no invoices for
  // anyone else rather than relying on the client to hide them.
  const canSeeBilling = req.user.role === 'admin';

  const [appointments, records, invoices, labCases] = await Promise.all([
    Appointment.find({ patient: patient._id }).populate('dentist', 'name colour avatarInitials').sort({ startAt: -1 }).limit(20).lean({ virtuals: true }),
    HealthRecord.find({ patient: patient._id }).populate('author', 'name colour avatarInitials').sort({ recordedAt: -1 }).limit(20).lean(),
    canSeeBilling
      ? Invoice.find({ patient: patient._id }).sort({ issuedAt: -1 }).limit(20).lean({ virtuals: true })
      : [],
    LabCase.find({ patient: patient._id }).sort({ dueAt: -1 }).limit(10).lean({ virtuals: true }),
  ]);

  res.json({ success: true, data: { patient, appointments, records, invoices, labCases } });
});

export const createPatient = asyncHandler(async (req, res) => {
  const payload = { ...req.body, fileNo: await nextFileNo() };
  if (!payload.primaryDentist) delete payload.primaryDentist;
  const patient = await Patient.create(payload);
  res.status(201).json({ success: true, data: patient });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.primaryDentist === '') payload.primaryDentist = null;
  const patient = await Patient.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!patient) throw ApiError.notFound('Patient not found');
  res.json({ success: true, data: patient });
});

export const deletePatient = asyncHandler(async (req, res) => {
  // Clinical history must survive — archive instead of destroying the record.
  const patient = await Patient.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
  if (!patient) throw ApiError.notFound('Patient not found');
  res.json({ success: true, message: 'Patient archived', data: patient });
});

export const toothChartSchema = z.object({
  tooth: z.number().int().min(11).max(48),
  status: z.enum(['healthy', 'caries', 'filled', 'crown', 'root-canal', 'implant', 'missing', 'watch']),
  surfaces: z.array(z.string()).optional(),
  note: z.string().optional(),
});

export const updateToothChart = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw ApiError.notFound('Patient not found');

  const entry = { ...req.body, updatedAt: new Date() };
  const existing = patient.toothChart.find((t) => t.tooth === entry.tooth);
  if (existing) {
    Object.assign(existing, entry);
  } else {
    patient.toothChart.push(entry);
  }

  await patient.save();
  res.json({ success: true, data: patient.toothChart });
});
