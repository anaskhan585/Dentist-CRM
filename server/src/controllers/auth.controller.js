import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env, isProd } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Use at least 8 characters'),
});

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

const cookieOptions = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Those credentials do not match our records');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);
  res.cookie('token', token, cookieOptions);
  res.json({ success: true, data: { token, user: user.toJSON() } });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: 'Signed out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Your current password is incorrect');
  }
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});
