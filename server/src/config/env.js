import dotenv from 'dotenv';

dotenv.config();

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/dentist-crm'),
  jwtSecret: required('JWT_SECRET', 'dev-only-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientOrigin: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    // A browser sends an Origin with no trailing slash, so a hosting panel
    // filled in as "https://example.com/" would never match and every request
    // would fail CORS. Normalise rather than make that a deployment trap.
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
};

export const isProd = env.nodeEnv === 'production';
