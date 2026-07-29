import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(advancedFormat);

export { dayjs };

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat('en-US');

export function money(value, { symbol = 'Rs', short = false } = {}) {
  const amount = Number(value) || 0;
  if (short && Math.abs(amount) >= 10000) return `${symbol} ${compact.format(amount)}`;
  return `${symbol} ${plain.format(Math.round(amount))}`;
}

export const number = (value) => plain.format(Number(value) || 0);

export function percent(value) {
  const n = Number(value) || 0;
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}

export const date = (value, pattern = 'DD MMM YYYY') => (value ? dayjs(value).format(pattern) : '—');
export const time = (value) => (value ? dayjs(value).format('h:mm A') : '—');

/** "Today, 2:30 PM" / "Tomorrow, 9:00 AM" / "14 Mar, 4:15 PM" */
export function dateTime(value) {
  if (!value) return '—';
  const d = dayjs(value);
  if (d.isToday()) return `Today, ${d.format('h:mm A')}`;
  if (d.isTomorrow()) return `Tomorrow, ${d.format('h:mm A')}`;
  return d.format('DD MMM, h:mm A');
}

export function fromNow(value) {
  if (!value) return '—';
  const d = dayjs(value);
  // Anything older than a week reads better as a plain date.
  return Math.abs(d.diff(dayjs(), 'day')) > 7 ? d.format('DD MMM YYYY') : d.fromNow();
}

export function initials(name = '') {
  return name
    .replace(/^(Dr\.?|Prof\.?)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export const fullName = (person) =>
  person ? (person.fullName ?? `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim()) : '—';

/** Turns 'root-canal' into 'Root canal'. */
export function titleCase(value = '') {
  const text = String(value).replace(/[-_]/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function age(dateOfBirth) {
  if (!dateOfBirth) return null;
  return dayjs().diff(dayjs(dateOfBirth), 'year');
}

/** Deterministic accent per person so avatars stay stable between renders. */
const AVATAR_COLOURS = ['#14544a', '#8c5a2b', '#3d6e96', '#6b4c8a', '#4a7c46', '#a07a25', '#a8443c'];

export function colourFor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
}
