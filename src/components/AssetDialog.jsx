import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, TriangleAlert, X } from 'lucide-react';
import { formatBidTime, formatDigits, formatVnd } from '../lib/format.js';
import {
  CONDITION_LABELS,
  SPEC_LABELS,
  conditionLevel,
  conditionText,
  specSummary,
  specText,
  statusOf,
} from '../lib/asset.js';
import Countdown from './Countdown.jsx';

export default function AssetDialog({ asset, deadline, dongRoi, giaNhap, giaToiThieu, onDoiGia, onDatGia, onDong }) {
  const status = statusOf(asset);
  const typed = Number(giaNhap || 0);
  const startingPrice = asset.starting_price ?? 0;
  const belowSuggested =
    !dongRoi && asset.starting_price != null && asset.bid_count === 0 && typed > 0 && typed < asset.starting_price;
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onDong();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onDong]);

  const summary = specSummary(asset.spec);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/70"
      onClick={onDong}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết ${asset.name}`}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
        <div
          className="relative w-full max-w-4xl rounded-xl border border-border bg-surface shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start gap-4 border-b border-border px-6 py-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3">
              <div className="min-w-[200px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-t-primary">{asset.name}</h2>
                  <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] ${status.lop}`}>
                    {status.nhan}
                  </span>
                  {asset.office && (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-t-secondary">
                      <MapPin className="h-3 w-3" />
                      {asset.office}
                    </span>
                  )}
                </div>
                <div className="mt-1 font-mono text-[11px] text-t-muted">
                  {asset.sku} · {asset.asset_type}
                </div>
                {summary && <div className="mt-0.5 text-[11px] text-t-micro">{summary}</div>}
              </div>
              <Countdown deadline={deadline} dongRoi={dongRoi} />
            </div>
            <button
              ref={closeRef}
              onClick={onDong}
              className="shrink-0 rounded-md p-1 text-t-micro transition-colors hover:bg-card hover:text-t-primary"
              title="Đóng (Esc)"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-6 px-6 py-5 lg:flex-row">
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-t-micro">Thông tin chi tiết</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(asset.spec || {}).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-[10px] text-t-micro">{SPEC_LABELS[key] || key}</div>
                    <div className="text-xs text-t-primary">{specText(key, value)}</div>
                  </div>
                ))}
                {Object.entries(asset.condition || {}).map(([key, value]) => {
                  const level = conditionLevel(key, value, asset.asset_type);
                  return (
                    <div key={key}>
                      <div className="text-[10px] text-t-micro">{CONDITION_LABELS[key] || key}</div>
                      <div
                        className={`text-xs ${
                          level === 'xau' ? 'font-medium text-warning' : level === 'sach' ? 'text-success' : 'text-t-micro'
                        }`}
                      >
                        {conditionText(key, value)}
                      </div>
                    </div>
                  );
                })}
              </div>
              {asset.note && (
                <div className="mt-3 rounded-md bg-warning/10 px-3 py-2 text-[11px] text-warning">
                  <strong>Ghi chú:</strong> {asset.note}
                </div>
              )}
              {dongRoi ? (
                <div className="mt-4 border-t border-border pt-3">
                  <div className="text-[10px] uppercase tracking-wide text-t-micro">Giá cuối</div>
                  <div className="text-sm font-semibold text-success">{formatVnd(asset.current_price)}đ</div>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-t-micro">Giá đề xuất</div>
                    <div className="text-xs text-t-muted">{formatVnd(startingPrice)}đ</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-t-micro">Bước giá</div>
                    <div className="text-xs text-t-secondary">{formatVnd(asset.bid_step_effective)}đ</div>
                  </div>
                </div>
              )}
            </div>

            <div className="order-2 w-full shrink-0 lg:order-1 lg:w-[220px]">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-t-micro">
                Lịch sử ({asset.bid_count} lượt)
              </h4>
              <div className="max-h-[240px] space-y-1.5 overflow-y-auto">
                {(asset.bids || []).map(bid => (
                  <div key={bid.id} className="flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="shrink-0 text-t-muted">{bid.bidder_name || bid.bidder_email}</span>
                    <span className="ml-auto font-mono text-[10px] tabular-nums text-t-micro" title={bid.created_at}>
                      {formatBidTime(bid.created_at)}
                    </span>
                    <span className="shrink-0 font-medium text-t-primary">{formatVnd(bid.amount)}</span>
                  </div>
                ))}
                {!asset.bids?.length && <p className="text-[11px] text-t-micro">Chưa có ai đặt giá</p>}
              </div>
            </div>

            <div className="-order-1 flex w-full shrink-0 flex-col gap-3 lg:order-2 lg:w-[260px]">
              {dongRoi ? (
                <div className="rounded-lg border border-border bg-card/40 p-4">
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-t-micro">Phiên đã kết thúc</h4>
                  <div className="text-[10px] text-t-micro">Giá cuối</div>
                  <div className="text-base font-semibold tabular-nums text-success">{formatVnd(asset.current_price)}đ</div>
                  <div className="mt-2 flex items-start gap-1 text-[11px] text-t-muted">
                    <span>{asset.bid_count > 0 ? 'Người khác trả cao hơn.' : 'Không có ai đặt giá.'}</span>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-t-micro">Kết quả chính thức được gửi qua email.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wide text-t-micro">Giá hiện tại</div>
                    <div className="text-xl font-bold tabular-nums text-success">{formatVnd(asset.current_price)}đ</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card/40 p-4">
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-t-micro">Đặt giá</h4>
                    <input
                      inputMode="numeric"
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-right text-sm font-semibold tabular-nums text-t-primary focus:border-primary focus:outline-none"
                      value={formatDigits(giaNhap)}
                      onChange={e => onDoiGia(e.target.value.replace(/\D/g, ''))}
                    />
                    <div className="mt-1 text-[10px] text-t-micro">
                      {asset.bid_count > 0
                        ? `Tối thiểu: ${formatVnd(giaToiThieu)}đ`
                        : `Giá đề xuất: ${formatVnd(startingPrice)}đ`}
                    </div>
                    {belowSuggested && (
                      <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-2">
                        <div className="flex items-start gap-1.5">
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                          <div className="text-[10px] leading-relaxed text-warning">
                            <div className="font-semibold">
                              Thấp hơn giá đề xuất {formatVnd(startingPrice - Number(giaNhap || 0))}đ
                            </div>
                            <div className="mt-0.5 text-t-secondary">
                              Bạn vẫn đặt được giá này. Nhưng nếu đây là giá cuối cùng thì kết quả cần{' '}
                              <strong className="text-warning">CFO phê duyệt</strong> trước khi bàn giao máy.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-2 flex gap-1">
                      {[1, 5, 10]
                        .map(k => k * asset.bid_step_effective)
                        .map(step => (
                          <button
                            key={step}
                            className="flex-1 whitespace-nowrap rounded border border-border bg-card px-1 py-1 text-[10px] text-t-muted transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                            onClick={() =>
                              onDoiGia(String((parseInt(giaNhap || String(giaToiThieu), 10) || giaToiThieu) + step))
                            }
                          >
                            +{formatVnd(step)}
                          </button>
                        ))}
                    </div>
                    <button
                      className="mt-3 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                      onClick={onDatGia}
                    >
                      {belowSuggested ? 'Đặt giá (cần CFO duyệt)' : 'Xác nhận đặt giá'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
