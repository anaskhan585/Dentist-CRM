import mongoose from 'mongoose';

const toothConditionSchema = new mongoose.Schema(
  {
    // FDI two-digit notation, e.g. 11 = upper right central incisor
    tooth: { type: Number, required: true, min: 11, max: 48 },
    status: {
      type: String,
      enum: ['healthy', 'caries', 'filled', 'crown', 'root-canal', 'implant', 'missing', 'watch'],
      default: 'healthy',
    },
    surfaces: { type: [String], default: [] },
    note: { type: String, trim: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    fileNo: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'undisclosed'], default: 'undisclosed' },
    address: {
      line1: String,
      city: String,
      state: String,
      postalCode: String,
    },
    bloodGroup: { type: String, trim: true },
    allergies: { type: [String], default: [] },
    medicalConditions: { type: [String], default: [] },
    medications: { type: [String], default: [] },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
    insurance: {
      provider: String,
      policyNo: String,
      validTill: Date,
    },
    primaryDentist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toothChart: { type: [toothConditionSchema], default: [] },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    balance: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    lastVisitAt: { type: Date },
    nextVisitAt: { type: Date },
  },
  { timestamps: true }
);

patientSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

patientSchema.virtual('age').get(function age() {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
});

patientSchema.index({ firstName: 'text', lastName: 'text', phone: 'text', fileNo: 'text' });
patientSchema.index({ status: 1, createdAt: -1 });

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

export const Patient = mongoose.model('Patient', patientSchema);
