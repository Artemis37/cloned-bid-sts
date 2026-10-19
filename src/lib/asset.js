// Asset classification and display helpers, mirrored from the original site.

const DAMAGE_RE =
  /hỏng|hư |lỗi|không lên nguồn|không boot|không nhận|sọc|nháy|chai pin|phồng pin|vỡ|nứt|mất|thiếu|liệt|rè|kêu|outdate|mdm|khóa/i;
const FIXED_RE = /đã fix|đã sửa|đã thay|đã khắc phục|da fix|da sua/i;
const GOOD = ['ok', 'yes', 'done'];
const NOT_APPLICABLE = ['na', 'n/a', 'none', '-'];
const UNKNOWN = ['unknown', 'unknow', 'chưa rõ', 'chua ro', 'chua danh gia'];
const PORTABLE = ['laptop', 'macbook', 'mac book', 'notebook', 'mobile', 'phone', 'iphone', 'android', 'tablet', 'ipad'];
const VALUE_LABELS = {
  no: 'Không có',
  none: 'Không có',
  na: 'Không có thông số',
  unknown: 'Không đánh giá được',
  unknow: 'Không đánh giá được',
};

function formatBattery(v) {
  const s = String(v ?? '').trim();
  if (!s) return '-';
  const n = Number(s.replace(/%$/, '').replace(',', '.'));
  return Number.isFinite(n) ? `${Math.round(n <= 1 ? n * 100 : n)}%` : s;
}

export function conditionText(key, value) {
  const s = String(value ?? '').trim();
  return VALUE_LABELS[s.toLowerCase()] || (key === 'battery_pct' ? formatBattery(value) : s || '-');
}

function isPortable(assetType) {
  const s = String(assetType || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  return !s || (!/\bimac\b/.test(s) && PORTABLE.some(p => s.includes(p)));
}

function batteryLevel(s) {
  const v = s.trim().toLowerCase();
  if (!v) return 'trong';
  if (GOOD.includes(v)) return 'sach';
  if (NOT_APPLICABLE.includes(v)) return 'khongap';
  if (UNKNOWN.includes(v)) return 'trong';
  const n = Number(v.replace(/%$/, '').replace(',', '.'));
  if (!Number.isFinite(n)) return 'xau';
  return (n <= 1 ? n * 100 : n) < 60 ? 'xau' : 'sach';
}

// 'sach' = good, 'xau' = bad, 'trong' = not assessed, 'khongap' = not applicable.
export function conditionLevel(key, value, assetType) {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === '') return 'trong';
  if (NOT_APPLICABLE.includes(v)) return 'khongap';
  if (UNKNOWN.includes(v)) return 'trong';
  if (key === 'battery_pct') return batteryLevel(v);
  if (key === 'charger') {
    if (v === 'no' || v.includes('không có')) return isPortable(assetType) ? 'xau' : 'khongap';
    return 'sach';
  }
  return GOOD.includes(v) || /^\d+$/.test(v) ? 'sach' : 'xau';
}

const TYPE_GROUPS = [
  [/^laptop\s*(win|windows)?$/i, 'Laptop Windows'],
  [/^(macbook|mac book|imac|laptop mac)$/i, 'Macbook/iMac'],
  [/^(pc|desktop|máy bàn|may ban)$/i, 'Máy bàn'],
  [/^(mobile|android|iphone|classic phone|tablet|ipad|điện thoại)$/i, 'Mobile'],
  [/^(network|switch|access point|router|firewall)$/i, 'Network'],
  [/^(monitor|màn hình|man hinh|screen)$/i, 'Monitor'],
  [/^tv$/i, 'TV'],
];

export function typeGroup(assetType) {
  const s = String(assetType || '').trim();
  if (!s) return 'Khác';
  for (const [re, group] of TYPE_GROUPS) if (re.test(s)) return group;
  return 'Khác';
}

export const TYPE_GROUP_ORDER = ['Laptop Windows', 'Macbook/iMac', 'Máy bàn', 'Mobile', 'Network', 'Monitor', 'TV', 'Khác'];

const SALVAGE_RE = /thanh lý linh kiện|thanh ly linh kien/i;

export const STATUS = {
  binh_thuong: { nhan: 'Bình thường', lop: 'bg-success/10 text-success border border-success/30' },
  hu_hong: { nhan: 'Có hư hỏng', lop: 'bg-warning/15 text-warning border border-warning/40 font-medium' },
  linh_kien: { nhan: 'Thanh lý linh kiện', lop: 'bg-danger/15 text-danger border border-danger/40 font-medium' },
  chua_ro: { nhan: 'Chưa đánh giá', lop: 'bg-card text-t-micro border border-border' },
};

function noteHasDamage(note) {
  const s = String(note || '');
  return !!s.trim() && s.split(/[;\n]+/).some(part => DAMAGE_RE.test(part) && !FIXED_RE.test(part));
}

export function statusKey(asset) {
  const cond = asset.condition || {};
  const type = asset.asset_type;
  if (SALVAGE_RE.test(asset.note || '') || conditionLevel('power', cond.power, type) === 'xau') return 'linh_kien';
  const assessed = Object.entries(cond).filter(([k, v]) => {
    const level = conditionLevel(k, v, type);
    return level !== 'trong' && level !== 'khongap';
  });
  if (assessed.some(([k, v]) => conditionLevel(k, v, type) === 'xau') || noteHasDamage(asset.note)) return 'hu_hong';
  return assessed.length === 0 ? 'chua_ro' : 'binh_thuong';
}

export function statusOf(asset) {
  const key = statusKey(asset);
  return { muc: key, ...STATUS[key] };
}

export const SPEC_LABELS = {
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  storage_gb: 'Ổ cứng',
  screen_size: 'Kích thước màn',
};

const SPEC_UNITS = { ram: 'GB', storage_gb: 'GB', screen_size: '"' };

function withUnit(key, value) {
  const unit = SPEC_UNITS[key] || '';
  return /^\d+([.,]\d+)?$/.test(value) ? `${value}${unit}` : value;
}

const SPEC_EMPTY = ['na', 'n/a', '-', 'unknown', 'unknow'];

export function specText(key, value) {
  const s = String(value ?? '').trim();
  return VALUE_LABELS[s.toLowerCase()] || (s.toLowerCase() === 'n/a' ? VALUE_LABELS.na : s ? withUnit(key, s) : '-');
}

export function specSummary(spec, keys = ['cpu', 'gpu', 'ram', 'storage_gb', 'screen_size']) {
  const src = spec || {};
  const parts = [];
  for (const key of keys) {
    const v = String(src[key] ?? '').trim();
    const lower = v.toLowerCase();
    if (!v || SPEC_EMPTY.includes(lower)) continue;
    if (lower === 'no' || lower === 'none') {
      if (key === 'gpu') continue;
      const label = SPEC_LABELS[key] || key;
      const name = label === label.toUpperCase() ? label : label.charAt(0).toLowerCase() + label.slice(1);
      parts.push(`Không có ${name}`);
      continue;
    }
    parts.push(withUnit(key, v));
  }
  return parts.join(' / ');
}

export const CONDITION_LABELS = {
  power: 'Nguồn',
  overview: 'Tổng quan',
  screen: 'Màn hình',
  keyboard: 'Bàn phím',
  speaker: 'Loa',
  wifi: 'Wifi',
  battery_pct: 'Pin',
  charger: 'Sạc',
};

// Next valid bid: current price + step once someone has bid, otherwise the suggested price.
export function minimumBid(asset) {
  return asset.bid_count > 0 ? asset.current_price + asset.bid_step_effective : asset.starting_price ?? 0;
}
