import { z } from 'zod';
import { Settings } from '../models/Settings.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const settingsSchema = z.object({
  clinic: z
    .object({
      name: z.string().min(1).optional(),
      tagline: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      address: z.string().optional(),
      registrationNo: z.string().optional(),
    })
    .optional(),
  locale: z
    .object({
      currency: z.string().optional(),
      currencySymbol: z.string().optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
      weekStartsOn: z.number().int().min(0).max(6).optional(),
    })
    .optional(),
  scheduling: z
    .object({
      slotMinutes: z.number().int().min(5).max(120).optional(),
      dayStart: z.string().optional(),
      dayEnd: z.string().optional(),
      chairs: z.array(z.string()).optional(),
      bufferMinutes: z.number().int().min(0).max(60).optional(),
    })
    .optional(),
  notifications: z
    .object({
      appointmentReminders: z.boolean().optional(),
      reminderLeadHours: z.number().int().min(1).max(168).optional(),
      recallCampaigns: z.boolean().optional(),
      labDueAlerts: z.boolean().optional(),
      lowStockAlerts: z.boolean().optional(),
      channel: z.enum(['sms', 'whatsapp', 'email']).optional(),
    })
    .optional(),
  billing: z
    .object({
      taxRate: z.number().min(0).max(100).optional(),
      invoicePrefix: z.string().optional(),
      paymentTermsDays: z.number().int().min(0).max(180).optional(),
      footerNote: z.string().optional(),
    })
    .optional(),
});

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await Settings.findOneAndUpdate(
    { key: 'clinic' },
    { $setOnInsert: { key: 'clinic' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  res.json({ success: true, data: settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  // Merge section-by-section so a partial save never wipes untouched groups.
  const flat = {};
  for (const [section, values] of Object.entries(req.body)) {
    for (const [key, value] of Object.entries(values ?? {})) {
      flat[`${section}.${key}`] = value;
    }
  }

  const settings = await Settings.findOneAndUpdate({ key: 'clinic' }, { $set: flat }, { new: true, upsert: true });
  res.json({ success: true, data: settings });
});
