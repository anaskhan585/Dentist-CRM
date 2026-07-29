import mongoose from 'mongoose';

/** Single-document clinic configuration backing the Preferences screen. */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'clinic', unique: true },
    clinic: {
      name: { type: String, default: 'Vanguard Dental Studio' },
      tagline: { type: String, default: 'Precision dentistry, unhurried care' },
      phone: { type: String, default: '+92 300 1234567' },
      email: { type: String, default: 'front-desk@vanguarddental.pk' },
      address: { type: String, default: '24-C Khayaban-e-Shahbaz, DHA Phase VI, Karachi' },
      registrationNo: { type: String, default: 'PMDC-DEN-44821' },
    },
    locale: {
      currency: { type: String, default: 'PKR' },
      currencySymbol: { type: String, default: 'Rs' },
      timezone: { type: String, default: 'Asia/Karachi' },
      dateFormat: { type: String, default: 'DD MMM YYYY' },
      weekStartsOn: { type: Number, default: 1 },
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
