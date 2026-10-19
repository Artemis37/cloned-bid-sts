import { Sparkles } from 'lucide-react';
import { batteryPercent, conditionText, statusOf } from '../lib/asset.js';
import { formatVnd } from '../lib/format.js';
import { RULES } from '../lib/insights-config.js';
import { scoreTone } from '../lib/insights.js';
import { ScorePill } from './InsightBits.jsx';

const PARTS = [
  ['condition', 'Tình trạng'],
  ['win', 'Khả năng thắng'],
  ['value', 'Giá'],
];

function batteryCell(asset) {
  const pct = batteryPercent(asset.condition?.battery_pct);
  return pct !== null ? `${Math.round(pct)}%` : conditionText('battery_pct', asset.condition?.battery_pct);
}

// Analysis section at the bottom of the detail popup: score breakdown with reasons, and same-model units.
export default function InsightPanel({ asset, insight, insightsById, assetById, onOpenAsset }) {
  const twins = [asset.id, ...insight.twinIds]
    .map(id => ({ asset: assetById.get(id), insight: insightsById.get(id) }))
    .sort(
      (x, y) =>
        Number(y.insight.eligible) - Number(x.insight.eligible) ||
        y.insight.score - x.insight.score ||
        x.asset.bid_count - y.asset.bid_count,
    );

  return (
    <div className="ins-panel">
      <div className="ins-panel-head">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="ins-panel-title">Phân tích gợi ý</span>
        {insight.eligible && (
          <>
            <ScorePill score={insight.score} />
            <span className="ins-panel-rank">
              Hạng {insight.rank}/{insight.rankOf} trong {insight.category}
            </span>
          </>
        )}
      </div>

      {insight.eligible ? (
        <div className="ins-parts">
          {PARTS.map(([key, label]) => {
            const part = insight.parts[key];
            return (
              <div key={key}>
                <div className="ins-part-head">
                  <span>
                    {label} <span className="ins-part-weight">({Math.round(RULES.weights[key] * 100)}%)</span>
                  </span>
                  <span>{part.score}</span>
                </div>
                <div className={`ins-bar ${scoreTone(part.score)}`}>
                  <span style={{ width: `${part.score}%` }} />
                </div>
                <ul className="ins-reasons">
                  {part.reasons.map(r => (
                    <li key={r.text} className={r.tone}>
                      {r.text}
                    </li>
                  ))}
                  {part.reasons.length === 0 && <li>Không có điểm gì nổi bật</li>}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ins-excluded">
          Không nằm trong danh sách gợi ý: {insight.excluded.join('; ')}.
        </div>
      )}

      {twins.length > 1 && (
        <div className="ins-twins">
          <div className="ins-part-head" style={{ marginBottom: 6 }}>
            <span>
              Máy cùng mẫu ({twins.length}) <span className="ins-part-weight">{insight.model}</span>
            </span>
            <span className="ins-part-weight">
              {twins.filter(t => t.asset.bid_count === 0).length} máy chưa ai đặt
            </span>
          </div>
          <div className="ins-twins-scroll">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Tình trạng</th>
                  <th>Pin</th>
                  <th>RAM / Ổ cứng</th>
                  <th className="num">Giá hiện tại</th>
                  <th className="num">Lượt đặt</th>
                  <th className="num">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {twins.map(t => {
                  const current = t.asset.id === asset.id;
                  return (
                    <tr
                      key={t.asset.id}
                      className={current ? 'is-current' : ''}
                      onClick={current ? undefined : () => onOpenAsset(t.asset.id)}
                      title={current ? 'Máy đang xem' : 'Bấm để xem máy này'}
                    >
                      <td className="font-mono">{t.asset.sku}</td>
                      <td>{statusOf(t.asset).nhan}</td>
                      <td>{batteryCell(t.asset)}</td>
                      <td>
                        {t.asset.spec?.ram || '-'} / {t.asset.spec?.storage_gb || '-'}
                      </td>
                      <td className="num">{formatVnd(t.asset.current_price)}</td>
                      <td className="num">{t.asset.bid_count}</td>
                      <td className="num">{t.insight.eligible ? t.insight.score : <span className="ins-muted">-</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
