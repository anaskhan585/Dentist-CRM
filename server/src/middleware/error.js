import { ApiError } from '../utils/ApiError.js';
import { isProd } from '../config/env.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
export function errorHandler(err, _req, res, _next) {
  let error = err;

  if (error.name === 'ValidationError') {
    error = ApiError.badRequest('Validation failed', {
      fields: Object.fromEntries(
        Object.entries(error.errors).map(([field, detail]) => [field, detail.message])
      ),
    });
  } else if (error.name === 'CastError') {
    error = ApiError.badRequest(`Invalid value for "${error.path}"`);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue ?? {})[0] ?? 'field';
    error = ApiError.conflict(`A record with that ${field} already exists`);
  }

  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) console.error('[error]', err);

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && isProd ? 'Something went wrong on our end' : error.message,
    ...(error.details ? { details: error.details } : {}),
    ...(isProd ? {} : { stack: err.stack }),
  });
}
