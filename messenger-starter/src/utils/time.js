const pad = (n) => String(n).padStart(2, '0');
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Chat-list style time: "14:05", "Yesterday", "Mon" or "28/11/26". */
export function formatChatTime(millis, now = Date.now()) {
  if (!millis) return '';
  const date = new Date(millis);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const daysAgo = Math.round((today - startOfDay) / DAY_MS);

  if (daysAgo <= 0) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return WEEKDAYS[date.getDay()];
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(
    date.getFullYear(),
  ).slice(-2)}`;
}
