/** Normalises `?page=&limit=` into skip/limit with sane bounds. */
export function paginate(query, { defaultLimit = 25, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function meta({ page, limit, total }) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

/** Escapes user input before it goes into a RegExp. */
export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Builds an inclusive day range for a YYYY-MM-DD string. */
export function dayRange(dateString) {
  const start = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
