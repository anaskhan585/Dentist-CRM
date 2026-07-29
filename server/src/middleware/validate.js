import { ApiError } from '../utils/ApiError.js';

/** Validates `req[source]` against a zod schema and replaces it with the parsed value. */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        fields[issue.path.join('.') || source] = issue.message;
      }
      return next(ApiError.badRequest('Please check the highlighted fields', { fields }));
    }
    req[source] = result.data;
    return next();
  };
