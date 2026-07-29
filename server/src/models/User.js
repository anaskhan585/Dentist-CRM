import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['admin', 'dentist', 'hygienist', 'receptionist'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'receptionist' },
    specialty: { type: String, trim: true },
    phone: { type: String, trim: true },
    colour: { type: String, default: '#0C5148' },
    avatarInitials: { type: String, trim: true },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.pre('save', function setInitials(next) {
  if (!this.avatarInitials && this.name) {
    this.avatarInitials = this.name
      .replace(/^(Dr\.?|Prof\.?)\s+/i, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
