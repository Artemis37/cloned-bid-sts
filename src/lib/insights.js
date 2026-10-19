// "Gợi ý dễ thắng": scores items that are in good shape and likely to be won, with the reasons behind each score.
// Pure functions over the auction data, so a new crawl + build recalculates everything.
import {
  STATUS,
  TYPE_GROUP_ORDER,
  batteryMarkedOk,
  batteryPercent,
  conditionLevel,
  conditionText,
  isPortable,
  statusKey,
  typeGroup,
} from './asset.js';
import { formatVnd } from './format.js';
import { RULES } from './insights-config.js';

const clamp01 = x => Math.max(0, Math.min(1, x));

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Most frequent value; ties go to the smaller one.
function mostCommon(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

// "1TB + 128GB" -> 1152, "240GB x 2" -> 480, "Unknown" -> null.
function sizeGb(value) {
  let total = 0;
  let found = false;
  for (const m of String(value ?? '').toLowerCase().matchAll(/(\d+(?:[.,]\d+)?)\s*(tb|gb)(?:\s*x\s*(\d+))?/g)) {
    found = true;
    total += Number(m[1].replace(',', '.')) * (m[2] === 'tb' ? 1024 : 1) * (m[3] ? Number(m[3]) : 1);
  }
  return found ? total : null;
}

// Spec text as listed, tidied: "1TB + 128GB", "16gb" -> "16GB".
function specLabel(value) {
  return String(value).trim().replace(/gb/gi, 'GB').replace(/tb/gi, 'TB');
}

// Weighted average over the parts that apply (weight > 0 and a score present).
function blend(parts, weights) {
  let sum = 0;
  let total = 0;
  for (const [key, score] of Object.entries(parts)) {
    if (score == null) continue;
    sum += score * weights[key];
    total += weights[key];
  }
  return total ? sum / total : 0.5;
}

const good = text => ({ tone: 'good', text });
const warn = text => ({ tone: 'warn', text });
const info = text => ({ tone: 'info', text });

function exclusionReasons(asset) {
  const reasons = [];
  const status = statusKey(asset);
  if (status !== RULES.requiredStatus) reasons.push(`Tình trạng "${STATUS[status].nhan}"`);
  if (isPortable(asset.asset_type)) {
    const raw = asset.condition?.battery_pct;
    const pct = batteryPercent(raw);
    if (pct !== null && pct <= RULES.minBatteryPct) {
      reasons.push(`Pin ${Math.round(pct)}% (cần trên ${RULES.minBatteryPct}%)`);
    } else if (pct === null && !batteryMarkedOk(raw)) {
      reasons.push(`Pin "${conditionText('battery_pct', raw)}", chưa xác nhận trên ${RULES.minBatteryPct}%`);
    }
  }
  return reasons;
}

function conditionPart(asset, peerSpec) {
  const portable = isPortable(asset.asset_type);
  const reasons = [];
  const scores = { battery: null, charger: null, spec: null };

  if (portable) {
    const raw = asset.condition?.battery_pct;
    const pct = batteryPercent(raw);
    if (pct !== null) {
      scores.battery = clamp01((pct - RULES.minBatteryPct) / (100 - RULES.minBatteryPct));
      const text = `Pin ${Math.round(pct)}%`;
      reasons.push(pct >= RULES.goodBatteryPct ? good(text) : info(`${text}, còn dùng được`));
    } else {
      scores.battery = RULES.batteryOkScore;
      reasons.push(info('Pin ghi "OK", không rõ phần trăm'));
    }
    const charger = conditionLevel('charger', asset.condition?.charger, asset.asset_type);
    if (charger === 'sach') {
      scores.charger = 1;
      reasons.push(good('Có kèm sạc'));
    } else if (charger === 'xau') {
      scores.charger = 0;
      reasons.push(warn('Không kèm sạc'));
    } else {
      scores.charger = 0.5;
    }
  }

  if (peerSpec) {
    let spec = 0.5;
    for (const [key, label, typical] of [
      ['ram', 'RAM', peerSpec.ram],
      ['storage_gb', 'Ổ cứng', peerSpec.storage],
    ]) {
      const mine = sizeGb(asset.spec?.[key]);
      if (mine == null || typical == null || Math.abs(mine - typical.gb) / typical.gb < RULES.specNoticeRatio) continue;
      const more = mine > typical.gb;
      spec += more ? 0.25 : -0.25;
      const text = `${label} ${specLabel(asset.spec[key])}, ${more ? 'nhiều' : 'ít'} hơn mức phổ biến ${typical.text} của mẫu này`;
      reasons.push(more ? good(text) : warn(text));
    }
    scores.spec = clamp01(spec);
  } else {
    scores.spec = 0.5;
  }

  const weights = { ...RULES.conditionWeights };
  if (!portable) weights.battery = weights.charger = 0;
  return { score: blend(scores, weights), reasons };
}

function winPart(asset, capturedAtMs) {
  const reasons = [];
  const n = asset.bid_count;
  const bids = [...(asset.bids || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const bidders = new Set(bids.map(b => b.bidder_email)).size;

  let duels = 0;
  for (let i = 1; i < bids.length; i++) {
    const gapMin = (new Date(bids[i].created_at) - new Date(bids[i - 1].created_at)) / 60000;
    if (bids[i].bidder_email !== bids[i - 1].bidder_email && gapMin <= RULES.duelMinutes) duels++;
  }
  const last = bids.length ? new Date(bids[bids.length - 1].created_at).getTime() : null;
  const hoursSinceLast = last == null ? null : (capturedAtMs - last) / 36e5;

  const scores = {
    bids: Math.exp(-n / 3),
    bidders: n === 0 ? 1 : bidders <= 1 ? 0.75 : bidders === 2 ? 0.4 : 0.15,
    duels: duels === 0 ? 1 : duels === 1 ? 0.55 : 0.25,
    recency:
      hoursSinceLast == null ? 1 : hoursSinceLast >= 24 ? 0.9 : hoursSinceLast >= 6 ? 0.75 : hoursSinceLast >= 1 ? 0.55 : 0.35,
  };

  if (n === 0) {
    reasons.push(good('Chưa ai đặt giá'));
  } else {
    // Emails are masked to their first letter, so distinct bidders is an estimate.
    const who = bidders <= 1 ? 'từ 1 người' : `từ khoảng ${bidders} người`;
    reasons.push((n <= 2 && bidders <= 1 ? info : warn)(`${n} lượt đặt giá ${who}`));
    if (duels > 0) {
      reasons.push(warn(`${duels} lần bị người khác vượt giá trong vòng ${RULES.duelMinutes} phút: đang có người tranh`));
    } else if (bids.length >= 2) {
      reasons.push(good(`Không có lượt vượt giá dồn dập (trong vòng ${RULES.duelMinutes} phút)`));
    }
    if (hoursSinceLast != null) {
      const ago =
        hoursSinceLast < 1 ? `${Math.max(1, Math.round(hoursSinceLast * 60))} phút` : `${Math.round(hoursSinceLast)} giờ`;
      const text = `Lượt cuối ${ago} trước lúc lấy dữ liệu`;
      reasons.push(hoursSinceLast < 1 ? warn(text) : info(text));
    }
    if (n > bids.length) reasons.push(info(`Chỉ thấy ${bids.length} lượt gần nhất trong ${n} lượt`));
  }

  return { score: blend(scores, RULES.winWeights), reasons, bidders, duels };
}

function valuePart(asset, peerPrices) {
  const reasons = [];
  const scores = { suggested: null, peers: null };
  const start = asset.starting_price;
  const price = asset.current_price;

  if (start > 0) {
    const ratio = price / start;
    scores.suggested = ratio <= 1 ? 1 : clamp01(1 - (ratio - 1) / 0.5);
    if (ratio < 1) {
      reasons.push(
        warn(
          `Giá hiện tại thấp hơn giá đề xuất ${formatVnd(start - price)}đ. Nếu thắng dưới giá đề xuất cần CFO duyệt; đặt từ ${formatVnd(start)}đ để chắc chắn`,
        ),
      );
    } else if (ratio - 1 >= RULES.priceNoticeRatio) {
      reasons.push(warn(`Giá đã lên ${Math.round((ratio - 1) * 100)}% so với giá đề xuất`));
    } else {
      reasons.push(good('Đang ở mức giá đề xuất'));
    }
  }

  let peerDiff = null;
  if (peerPrices) {
    const typical = median(peerPrices);
    peerDiff = (typical - price) / typical;
    scores.peers = clamp01(0.5 + peerDiff * 2.5);
    if (Math.abs(peerDiff) >= RULES.priceNoticeRatio) {
      const text = `${peerDiff > 0 ? 'Rẻ' : 'Đắt'} hơn ${Math.round(Math.abs(peerDiff) * 100)}% so với giá giữa (${formatVnd(
        typical,
      )}đ) của ${peerPrices.length} máy cùng mẫu`;
      reasons.push(peerDiff > 0 ? good(text) : warn(text));
    }
  }

  return { score: blend(scores, { suggested: 1, peers: 1 }), reasons, peerDiff };
}

function chipsFor(asset, win, value, condition) {
  const chips = [];
  if (isPortable(asset.asset_type)) {
    const pct = batteryPercent(asset.condition?.battery_pct);
    chips.push(pct !== null ? { tone: pct >= RULES.goodBatteryPct ? 'good' : 'info', text: `Pin ${Math.round(pct)}%` } : info('Pin OK'));
  }
  if (asset.bid_count === 0) chips.push(good('Chưa ai đặt'));
  else if (win.duels > 0) chips.push(warn('Đang bị tranh'));
  else chips.push(info(`${asset.bid_count} lượt · ~${win.bidders} người`));
  if (value.peerDiff != null && value.peerDiff >= RULES.priceNoticeRatio) {
    chips.push(good(`Rẻ hơn ${Math.round(value.peerDiff * 100)}% máy cùng mẫu`));
  } else {
    const better = condition.reasons.find(r => r.tone === 'good' && /nhiều hơn mức phổ biến/.test(r.text));
    if (better) chips.push(good(better.text.split(',')[0]));
  }
  return chips;
}

/**
 * Builds the suggestion analysis for every asset.
 * @param assets   auction assets
 * @param modelOf  product name -> model key (units of one model are compared with each other)
 * @param capturedAt ISO time the data was crawled; bid recency is measured from it
 * @returns { byId: Map<id, insight>, categories: summary[] }
 */
export function buildInsights(assets, { modelOf, capturedAt }) {
  const capturedAtMs = capturedAt ? new Date(capturedAt).getTime() : Date.now();

  const byModel = new Map();
  for (const a of assets) {
    const key = modelOf(a.name);
    if (!byModel.has(key)) byModel.set(key, []);
    byModel.get(key).push(a);
  }

  const byId = new Map();
  for (const asset of assets) {
    const model = modelOf(asset.name);
    const peers = byModel.get(model);
    const others = peers.filter(p => p.id !== asset.id);
    const enough = peers.length >= RULES.minPeers;
    // The model's most common size, with how a unit of that size lists it.
    const typicalOf = key => {
      const sized = peers.map(p => ({ gb: sizeGb(p.spec?.[key]), raw: p.spec?.[key] })).filter(s => s.gb != null);
      if (sized.length < RULES.minPeers) return null;
      const gb = mostCommon(sized.map(s => s.gb));
      return { gb, text: specLabel(sized.find(s => s.gb === gb).raw) };
    };
    const peerSpec = enough ? { ram: typicalOf('ram'), storage: typicalOf('storage_gb') } : null;
    const peerPrices = enough && others.length ? others.map(p => p.current_price) : null;

    const excluded = exclusionReasons(asset);
    const condition = conditionPart(asset, peerSpec);
    const win = winPart(asset, capturedAtMs);
    const value = valuePart(asset, peerPrices);
    const { weights } = RULES;
    const score = Math.round(100 * (weights.condition * condition.score + weights.win * win.score + weights.value * value.score));

    byId.set(asset.id, {
      id: asset.id,
      eligible: excluded.length === 0,
      excluded,
      category: typeGroup(asset.asset_type),
      model,
      twinIds: others.map(p => p.id),
      score,
      parts: {
        condition: { score: Math.round(condition.score * 100), reasons: condition.reasons },
        win: { score: Math.round(win.score * 100), reasons: win.reasons },
        value: { score: Math.round(value.score * 100), reasons: value.reasons },
      },
      chips: chipsFor(asset, win, value, condition),
      rank: null,
      rankOf: null,
    });
  }

  // Rank eligible items within their category: higher score, then fewer bids, then cheaper.
  const assetById = new Map(assets.map(a => [a.id, a]));
  const categories = [];
  for (const category of TYPE_GROUP_ORDER) {
    const all = [...byId.values()].filter(i => i.category === category);
    if (!all.length) continue;
    const ranked = all
      .filter(i => i.eligible)
      .sort((x, y) => {
        const ax = assetById.get(x.id);
        const ay = assetById.get(y.id);
        return y.score - x.score || ax.bid_count - ay.bid_count || ax.current_price - ay.current_price;
      });
    ranked.forEach((insight, i) => {
      insight.rank = i + 1;
      insight.rankOf = ranked.length;
    });
    categories.push({
      category,
      total: all.length,
      eligible: ranked.length,
      eligibleNoBids: ranked.filter(i => assetById.get(i.id).bid_count === 0).length,
      topIds: ranked.slice(0, 3).map(i => i.id),
    });
  }

  return { byId, categories };
}

export function scoreTone(score) {
  return score >= 75 ? 'good' : score >= 60 ? 'info' : 'low';
}
