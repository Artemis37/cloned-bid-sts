import { Sparkles } from 'lucide-react';
import { RULES } from '../lib/insights-config.js';

const pct = w => Math.round(w * 100);

// Per-category overview shown above the list while suggestions are on. Clicking a card filters to that category.
export default function InsightSummary({ categories, assetById, insightsById, capturedAt, activeType, onPickType }) {
  const eligible = categories.reduce((n, c) => n + c.eligible, 0);
  const total = categories.reduce((n, c) => n + c.total, 0);
  const { weights } = RULES;
  return (
    <div className="ins-summary">
      <div className="ins-summary-head">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>
          <strong>
            {eligible}/{total} máy đạt chuẩn
          </strong>{' '}
          (tình trạng Bình thường, pin trên {RULES.minBatteryPct}% nếu có pin), xếp theo điểm trong từng loại.
        </span>
        {capturedAt && (
          <span className="ins-summary-time">Dữ liệu lúc {new Date(capturedAt).toLocaleString('vi-VN')}</span>
        )}
      </div>
      <div className="ins-cards">
        {categories.map(c => {
          const top = c.topIds[0] != null ? assetById.get(c.topIds[0]) : null;
          return (
            <button
              key={c.category}
              type="button"
              className={`ins-card ${activeType === c.category ? 'is-active' : ''} ${c.eligible ? '' : 'is-empty'}`}
              onClick={() => onPickType(activeType === c.category ? 'all' : c.category)}
              title={activeType === c.category ? 'Bỏ lọc loại này' : `Chỉ xem ${c.category}`}
            >
              <span className="ins-card-title">
                <span>{c.category}</span>
                <span>
                  {c.eligible}/{c.total}
                </span>
              </span>
              <span>{c.eligible ? `${c.eligibleNoBids} máy đạt chuẩn chưa ai đặt` : 'Không có máy đạt chuẩn'}</span>
              {top && (
                <span className="ins-card-top">
                  Cao nhất: {top.name} · {insightsById.get(top.id).score} điểm
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="ins-legend">
        Điểm = Tình trạng {pct(weights.condition)}% + Khả năng thắng {pct(weights.win)}% + Giá trị {pct(weights.value)}%
        (giá và đời CPU). Bấm vào máy để xem lý do chi tiết và các máy cùng mẫu.
      </div>
    </div>
  );
}
