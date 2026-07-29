import mongoose from 'mongoose';

// The lab workflow is a pipeline — these stages drive the Lab Tracking board.
export const LAB_STAGES = [
  'impression-taken',
  'sent-to-lab',
  'in-fabrication',
  'trial-fitting',
  'received',
  'delivered',
];

const labCaseSchema = new mongoose.Schema(
  {
    caseNo: { type: String, required: true, unique: true, trim: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    dentist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lab: {
      name: { type: String, required: true, trim: true },
      contact: String,
      phone: String,
    },
    workType: {
      type: String,
      enum: ['Crown', 'Bridge', 'Veneer', 'Denture', 'Night Guard', 'Aligner', 'Inlay/Onlay', 'Post & Core'],
      required: true,
    },
    shade: { type: String, trim: true },
    teeth: { type: [Number], default: [] },
    stage: { type: String, enum: LAB_STAGES, default: 'impression-taken' },
    sentAt: { type: Date },
    dueAt: { type: Date, required: true },
    receivedAt: { type: Date },
    deliveredAt: { type: Date },
    cost: { type: Number, default: 0 },
    priority: { type: String, enum: ['standard', 'urgent'], default: 'standard' },
    notes: { type: String, trim: true },
    history: {
      type: [
        {
          stage: String,
          at: { type: Date, default: Date.now },
          by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

labCaseSchema.virtual('isOverdue').get(function isOverdue() {
  if (!this.dueAt || ['received', 'delivered'].includes(this.stage)) return false;
  return this.dueAt.getTime() < Date.now();
});

labCaseSchema.index({ stage: 1, dueAt: 1 });

labCaseSchema.set('toJSON', { virtuals: true });
labCaseSchema.set('toObject', { virtuals: true });

export const LabCase = mongoose.model('LabCase', labCaseSchema);
