import mongoose from 'mongoose';

/** Single-document clinic configuration backing the Preferences screen. */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'clinic', unique: true },
    clinic: {
      name: { type: String, default: 'Vive Dental Clinic' },
      tagline: { type: String, default: 'One Place. One Team. One Smile.' },
      phone: { type: String, default: '(415) 555-0100' },
      email: { type: String, default: 'info@vive.dental' },
      address: { type: String, default: '1820 Harrison Street, Suite 300, San Francisco, CA 94103' },
      registrationNo: { type: String, default: 'CA-DEN-118204' },
    },
    locale: {
      currency: { type: String, default: 'USD' },
      currencySymbol: { type: String, default: '$' },
      timezone: { type: String, default: 'America/Los_Angeles' },
      dateFormat: { type: String, default: 'MMM D, YYYY' },
      weekStartsOn: { type: Number, default: 0 },
    },
    scheduling: {
      slotMinutes: { type: Number, default: 15 },
      dayStart: { type: String, default: '09:00' },
      dayEnd: { type: String, default: '19:00' },
      chairs: { type: [String], default: ['Chair 1', 'Chair 2', 'Chair 3', 'Surgery'] },
      bufferMinutes: { type: Number, default: 5 },
    },
    notifications: {
      appointmentReminders: { type: Boolean, default: true },
      reminderLeadHours: { type: Number, default: 24 },
      recallCampaigns: { type: Boolean, default: true },
      labDueAlerts: { type: Boolean, default: true },
      lowStockAlerts: { type: Boolean, default: false },
      channel: { type: String, enum: ['sms', 'whatsapp', 'email'], default: 'whatsapp' },
    },
    billing: {
      taxRate: { type: Number, default: 0 },
      invoicePrefix: { type: String, default: 'INV' },
      paymentTermsDays: { type: Number, default: 7 },
      footerNote: { type: String, default: 'Thank you for trusting us with your smile.' },
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
