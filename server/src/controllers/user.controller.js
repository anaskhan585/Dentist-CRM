import { z } from 'zod';
import { User, ROLES } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/query.js';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Enter the full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  role: z.enum(ROLES),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  colour: z.string().optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).optional(),
  workingHours: z.object({ start: z.string(), end: z.string() }).optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
});

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.active === 'true') filter.isActive = true;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { specialty: rx }];
  }

  const users = await User.find(filter).sort('name').lean();
  res.json({ success: true, data: users });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw ApiError.notFound('Team member not found');
  res.json({ success: true, data: user });
});

export const createUser = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) throw ApiError.conflict('That email is already registered');
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user.toJSON() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw ApiError.notFound('Team member not found');

  // Guard against an admin locking themselves out of the practice.
  if (user._id.toString() === req.user._id.toString() && req.body.isActive === false) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  Object.assign(user, req.body);
  await user.save();
  res.json({ success: true, data: user.toJSON() });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot remove your own account');
  }
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) throw ApiError.notFound('Team member not found');
  res.json({ success: true, message: 'Team member deactivated', data: user });
});
