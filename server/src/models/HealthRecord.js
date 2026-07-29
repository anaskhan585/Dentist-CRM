import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    label: String,
    kind: { type: String, enum: ['x-ray', 'photo', 'document', 'scan'], default: 'document' },
    url: String,
  },
  { _id: false }
);

const healthRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recordType: {
      type: String,
      enum: ['clinical-note', 'diagnosis', 'prescription', 'x-ray', 'treatment-plan', 'referral'],
      default: 'clinical-note',
    },
    title: { type: String, required: true, trim: true },
    // Structured SOAP-style clinical note — familiar to any practising dentist.
    chiefComplaint: { type: String, trim: true },
    findings: { type: String, trim: true },
    diagnosis: { type: String, trim: true },
    treatmentDone: { type: String, trim: true },
    plan: { type: String, trim: true },
    teeth: { type: [Number], default: [] },
    prescriptions: {
      type: [
        {
          drug: String,
          dosage: String,
          frequency: String,
          duration: String,
          _id: false,
        },
      ],
      default: [],
    },
    attachments: { type: [attachmentSchema], default: [] },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

healthRecordSchema.index({ patient: 1, recordedAt: -1 });

export const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
