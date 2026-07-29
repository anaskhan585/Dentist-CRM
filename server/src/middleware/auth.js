import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function readToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.token ?? null;
}

export const protect = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized('Session expired, please sign in again');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account is no longer active');

  req.user = user;
  next();
});

/** Route guard: `authorize('admin', 'dentist')` */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`This action is limited to: ${roles.join(', ')}`));
    }
    return next();
  };
