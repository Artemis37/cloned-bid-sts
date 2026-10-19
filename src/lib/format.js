export function formatVnd(n) {
  return n.toLocaleString('vi-VN');
}

// Formats a digits-only input string with thousands separators.
export function formatDigits(s) {
  const digits = (s || '').replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('vi-VN') : '';
}

// HH:mm:ss.SSS in local time, as shown in the bid history.
export function formatBidTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms}`;
}
