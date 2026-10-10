import { z } from 'zod';
import { Appointment, APPOINTMENT_STATUSES } from '../models/Appointment.js';
import { Patient } from '../models/Patient.js';
import { Settings } from '../models/Settings.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dayRange, meta, paginate } from '../utils/query.js';

export const appointmentSchema = z.object({
  patient: z.string().min(1, 'Choose a patient'),
  dentist: z.string().min(1, 'Choose a dentist'),
  treatment: z.string().min(1, 'Describe the treatment'),
  chair: z.string().optional(),
  startAt: z.coerce.date(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = appointmentSchema.partial();

/** Formats a slot in the clinic's own timezone, so the message reads correctly
 *  regardless of where the server happens to be hosted. */
async function describeSlot(startAt, durationMinutes) {
  const settings = await Settings.findOne({ key: 'clinic' }).select('locale.timezone').lean();
  const format = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: settings?.locale?.timezone ?? 'UTC',
  });
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return `${format.format(start)}–${format.format(end)}`;
}

/** Rejects a booking that overlaps an existing one for the same dentist. */
async function assertNoClash({ dentist, startAt, durationMinutes = 30, excludeId }) {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const sameDay = await Appointment.find({
    dentist,
    _id: { $ne: excludeId ?? null },
    status: { $nin: ['cancelled', 'no-show'] },
    startAt: { $gte: new Date(start.getTime() - 8 * 3600000), $lte: end },
  }).lean();

  const clash = sameDay.find((appt) => {
    const apptEnd = new Date(appt.startAt).getTime() + appt.durationMinutes * 60000;
    return new Date(appt.startAt).getTime() < end.getTime() && apptEnd > start.getTime();
  });

  if (clash) {
    // Name the clashing slot and the treatment — the front desk needs to know
    // what to move, and that switching chairs will not help.
    const slot = await describeSlot(clash.startAt, clash.durationMinutes);
    throw ApiError.conflict(
      `This clinician is already booked ${slot} for ${clash.treatment}. Choose another time, or a different clinician.`
    );
  }
}

export const listAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 50 });
  const filter = {};

  if (req.query.date) {
    const { start, end } = dayRange(req.query.date);
    filter.startAt = { $gte: start, $lt: end };
  } else if (req.query.from || req.query.to) {
    filter.startAt = {};
    if (req.query.from) filter.startAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.startAt.$lte = new Date(req.query.to);
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.dentist) filter.dentist = req.query.dentist;
  if (req.query.patient) filter.patient = req.query.patient;

  const [items, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'firstName lastName phone fileNo')
      .populate('dentist', 'name colour avatarInitials')
      .sort(req.query.sort ?? 'startAt')
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Appointment.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: meta({ page, limit, total }) });
});

export const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient')
    .populate('dentist', 'name colour avatarInitials specialty')
    .lean({ virtuals: true });
  if (!appointment) throw ApiError.notFound('Appointment not found');
  res.json({ success: true, data: appointment });
});

export const createAppointment = asyncHandler(async (req, res) => {
  await assertNoClash(req.body);
  const appointment = await Appointment.create({ ...req.body, createdBy: req.user._id });
  await Patient.findByIdAndUpdate(appointment.patient, { nextVisitAt: appointment.startAt });
  const populated = await appointment.populate([
    { path: 'patient', select: 'firstName lastName phone fileNo' },
    { path: 'dentist', select: 'name colour avatarInitials' },
  ]);
  res.status(201).json({ success: true, data: populated });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const existing = await Appointment.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Appointment not found');

  const rescheduling = req.body.startAt || req.body.durationMinutes || req.body.dentist;
  if (rescheduling) {
    await assertNoClash({
      dentist: req.body.dentist ?? existing.dentist,
      startAt: req.body.startAt ?? existing.startAt,
      durationMinutes: req.body.durationMinutes ?? existing.durationMinutes,
      excludeId: existing._id,
    });
  }

  Object.assign(existing, req.body);
  await existing.save();

  if (existing.status === 'completed') {
    await Patient.findByIdAndUpdate(existing.patient, { lastVisitAt: existing.startAt });
  }

  const populated = await existing.populate([
    { path: 'patient', select: 'firstName lastName phone fileNo' },
    { path: 'dentist', select: 'name colour avatarInitials' },
  ]);
  res.json({ success: true, data: populated });
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  res.json({ success: true, message: 'Appointment removed' });
});

/** Chair-by-chair agenda used by the day view. */
export const getDaySchedule = asyncHandler(async (req, res) => {
  const { start, end } = dayRange(req.query.date);
  const appointments = await Appointment.find({ startAt: { $gte: start, $lt: end } })
    .populate('patient', 'firstName lastName phone fileNo')
    .populate('dentist', 'name colour avatarInitials')
    .sort('startAt')
    .lean({ virtuals: true });

  res.json({ success: true, data: appointments, meta: { date: start } });
});
