import mongoose from 'mongoose';

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'in-progress',
  'completed',
  'cancelled',
  'no-show',
];

export const TREATMENT_TYPES = [
  'Consultation',
  'Scaling & Polishing',
  'Composite Filling',
  'Root Canal',
  'Crown Fitting',
  'Extraction',
  'Implant',
  'Orthodontic Adjustment',
  'Teeth Whitening',
  'Denture Fitting',
  'Follow-up',
];

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    dentist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    treatment: { type: String, required: true, trim: true },
    chair: { type: String, default: 'Chair 1' },
    startAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30, min: 5, max: 480 },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'scheduled' },
    notes: { type: String, trim: true },
    reminderSent: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

appointmentSchema.virtual('endAt').get(function endAt() {
  return new Date(this.startAt.getTime() + this.durationMinutes * 60000);
});

appointmentSchema.index({ startAt: 1, dentist: 1 });
appointmentSchema.index({ patient: 1, startAt: -1 });

appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
