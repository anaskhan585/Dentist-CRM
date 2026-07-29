import { z } from 'zod';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, meta, paginate } from '../utils/query.js';

export const messageSchema = z.object({
  channel: z.enum(['internal', 'sms', 'whatsapp', 'email']).optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  subject: z.string().optional(),
  body: z.string().min(1, 'Write a message'),
  recipientUser: z.string().optional().or(z.literal('')),
  patient: z.string().optional().or(z.literal('')),
  thread: z.string().optional(),
  category: z.enum(['general', 'appointment-reminder', 'recall', 'billing', 'lab', 'urgent']).optional(),
});

export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 40 });
  const filter = {};
  if (req.query.channel) filter.channel = req.query.channel;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.unread === 'true') filter.isRead = false;
  if (req.query.starred === 'true') filter.isStarred = true;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ subject: rx }, { body: rx }];
  }

  const [items, total, unread] = await Promise.all([
    Message.find(filter)
      .populate('sender', 'name colour avatarInitials role')
      .populate('recipientUser', 'name colour avatarInitials')
      .populate('patient', 'firstName lastName fileNo phone')
      .sort('-sentAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments(filter),
    Message.countDocuments({ isRead: false }),
  ]);

  res.json({ success: true, data: items, meta: { ...meta({ page, limit, total }), unread } });
});

export const createMessage = asyncHandler(async (req, res) => {
  const payload = { ...req.body, sender: req.user._id, sentAt: new Date() };
  if (!payload.recipientUser) delete payload.recipientUser;
  if (!payload.patient) delete payload.patient;
  if (!payload.thread) {
    payload.thread = payload.patient
      ? `patient:${payload.patient}`
      : `user:${[req.user._id.toString(), payload.recipientUser].filter(Boolean).sort().join(':')}`;
  }

  const message = await Message.create(payload);
  const populated = await message.populate([
    { path: 'sender', select: 'name colour avatarInitials role' },
    { path: 'patient', select: 'firstName lastName fileNo phone' },
    { path: 'recipientUser', select: 'name colour avatarInitials' },
  ]);
  res.status(201).json({ success: true, data: populated });
});

export const markRead = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndUpdate(
    req.params.id,
    { isRead: req.body.isRead ?? true },
    { new: true }
  );
  if (!message) throw ApiError.notFound('Message not found');
  res.json({ success: true, data: message });
});

export const toggleStar = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  message.isStarred = !message.isStarred;
  await message.save();
  res.json({ success: true, data: message });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  res.json({ success: true, message: 'Message deleted' });
});
