import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Heart, Star, X } from 'lucide-react';
import { trapFocus } from '../lib/focusTrap.js';

function Tag({ lop, children }) {
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${lop}`}>{children}</span>;
}

// Guided tour steps. `neo` matches a [data-huong-dan] anchor on the page.
const STEPS = [
  {
    tieuDe: 'Chào mừng đến sàn đấu giá',
    noiDung: (
      <>
        <p>
          Đây là sàn đấu giá nội bộ cho tài sản IT thanh lý. Xem nhanh vài bước để biết cách tìm máy và đặt giá, mất
          khoảng một phút.
        </p>
        <p className="text-t-micro">
          Bấm Bắt đầu để xem, Bỏ qua nếu đã quen. Trên máy tính dùng được phím mũi tên và Esc.
        </p>
      </>
    ),
  },
  {
    neo: 'dong-ho',
    tieuDe: 'Thời gian còn lại',
    noiDung: (
      <>
        <p>Đồng hồ đếm ngược tới lúc đóng phiên.</p>
        <p>
          Phiên đóng <strong>đúng giờ</strong>, không gia hạn kể cả khi có người đặt giá phút chót. Cửa sổ chi tiết của
          từng tài sản cũng có đồng hồ này, ở trên cùng.
        </p>
      </>
    ),
  },
  {
    neo: 'bo-loc',
    tieuDe: 'Tìm và lọc tài sản',
    noiDung: (
      <>
        <p>Ô tìm kiếm nhận tên máy, SKU, văn phòng hoặc cấu hình (vd: i7, 16GB).</p>
        <p>
          Lọc theo <strong>Loại thiết bị</strong>, <strong>Văn phòng</strong>, <strong>Tình trạng</strong>,{' '}
          <strong>Mức quan tâm</strong>, khoảng <strong>Giá từ / Giá đến</strong> (tính theo giá hiện tại), và cấu hình:{' '}
          <strong>RAM</strong>, <strong>CPU</strong>, <strong>Card đồ hoạ</strong>, <strong>Ổ cứng</strong>,{' '}
          <strong>Màn hình</strong>. Trên máy tính, bấm tiêu đề cột để sắp xếp.
        </p>
      </>
    ),
  },
  {
    neo: 'theo-doi',
    tieuDe: 'Theo dõi máy bạn quan tâm',
    noiDung: (
      <>
        <p>
          Bấm <Heart className="inline h-3.5 w-3.5 fill-danger text-danger" /> để theo dõi, bấm lần nữa để bỏ.
        </p>
        <p>
          Ở ô <strong>Mức quan tâm</strong>, chọn <strong>Tôi đang theo dõi</strong> để chỉ xem các máy đó.
        </p>
      </>
    ),
  },
  {
    neo: 'tai-san',
    tieuDe: 'Mở chi tiết tài sản',
    noiDung: (
      <>
        <p>Bấm vào một tài sản để xem cấu hình, tình trạng từng bộ phận, lịch sử đặt giá và đặt giá.</p>
        <div className="flex flex-wrap gap-1.5">
          <Tag lop="bg-success/10 text-success border border-success/30">Bình thường</Tag>
          <Tag lop="bg-warning/15 text-warning border border-warning/40">Có hư hỏng</Tag>
          <Tag lop="bg-danger/15 text-danger border border-danger/40">Thanh lý linh kiện</Tag>
        </div>
        <p>
          Dòng <Star className="inline h-3 w-3 fill-warning text-warning" />{' '}
          <span className="text-warning">Bạn đang giữ giá cao nhất</span> hiện dưới tên máy khi bạn đang dẫn.
        </p>
      </>
    ),
  },
  {
    tieuDe: 'Đặt giá',
    noiDung: (
      <>
        <p>Trong cửa sổ chi tiết, khung đặt giá gom đủ thứ để quyết định:</p>
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="rounded-md border border-success/30 bg-success/5 px-3 py-1.5">
            <div className="text-[10px] uppercase tracking-wide text-t-micro">Giá hiện tại</div>
            <div className="text-sm font-bold tabular-nums text-success">7.500.000đ</div>
          </div>
          <div className="rounded-md border border-border bg-surface px-3 py-1.5 text-right text-sm font-semibold tabular-nums text-t-primary">
            7.510.000
          </div>
          <div className="flex gap-1">
            {['+10.000', '+50.000', '+100.000'].map(label => (
              <span
                key={label}
                className="flex-1 rounded border border-border px-1 py-1 text-center text-[10px] text-t-muted"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="rounded-md bg-primary py-1.5 text-center text-[11px] font-semibold text-white">
            Xác nhận đặt giá
          </div>
        </div>
        <p>
          Ô giá điền sẵn giá hiện tại cộng 10.000đ, hoặc giá đề xuất nếu chưa ai đặt. Nút đặt nhanh{' '}
          <strong>cộng dồn vào số đang có trong ô</strong>, không cộng vào giá hiện tại: bấm +50.000 rồi +10.000 hai lần
          thì ô thành 7.580.000.
        </p>
        <p>
          Bước giá là <strong>10.000đ</strong>. Nhập tay lệch mốc thì hệ thống gợi ý hai mức gần nhất. Đang giữ giá cao
          nhất vẫn tự nâng thêm được.
        </p>
        <p>
          Đặt thấp hơn giá đề xuất vẫn được, nhưng nếu đó là giá cuối thì kết quả cần{' '}
          <strong className="text-warning">CFO phê duyệt</strong>.
        </p>
      </>
    ),
  },
  {
    neo: 'nut-huong-dan',
    tieuDe: 'Xem lại bất cứ lúc nào',
    noiDung: (
      <p>
        Bấm <strong>Hướng dẫn</strong> để xem lại các bước này. Nút <strong>Nội quy</strong> bên cạnh để đọc lại nội quy
        đấu giá.
      </p>
    ),
  },
];

function findAnchor(name) {
  return (
    Array.from(document.querySelectorAll(`[data-huong-dan="${name}"]`)).find(el => el.getClientRects().length > 0) ??
    null
  );
}

function rectOf(el) {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function sameRect(a, b) {
  return a && b ? a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height : a === b;
}

export default function Tour({ step, onStep }) {
  const open = step >= 0;
  const [ready, setReady] = useState(false);
  const [rect, setRect] = useState(null);
  const [pos, setPos] = useState(null);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const nextRef = useRef(null);
  const focusedStepRef = useRef(-1);

  const close = () => {
    onStep(-1);
    window.scrollTo({ top: 0 });
  };
  const next = () => (step < STEPS.length - 1 ? onStep(step + 1) : close());

  // Locate and scroll to the step's anchor (retrying briefly while the page renders).
  useEffect(() => {
    if (!open) return;
    const name = STEPS[step]?.neo;
    setPos(null);
    setRect(null);
    anchorRef.current = null;
    if (!name) {
      setReady(true);
      return;
    }
    setReady(false);
    let cancelled = false;
    let tries = 0;
    let timer;
    const locate = () => {
      if (cancelled) return;
      const el = findAnchor(name);
      if (el) {
        anchorRef.current = el;
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        requestAnimationFrame(() => {
          if (!cancelled) {
            setRect(rectOf(el));
            setReady(true);
          }
        });
        return;
      }
      if (++tries >= 10) {
        setReady(true);
        return;
      }
      timer = setTimeout(locate, 100);
    };
    locate();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [open, step]);

  // Follow the anchor as the page scrolls or resizes.
  useEffect(() => {
    if (!open) return;
    const name = STEPS[step]?.neo;
    if (!name) return;
    const update = () => {
      let el = anchorRef.current;
      if (!el || !document.contains(el)) {
        el = findAnchor(name);
        anchorRef.current = el;
      }
      const next = el ? rectOf(el) : null;
      setRect(prev => (sameRect(prev, next) ? prev : next));
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const id = setInterval(update, 400);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      clearInterval(id);
    };
  }, [open, step]);

  // Place the panel below the anchor, above it if there's no room, or centered when there's no anchor.
  useLayoutEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxH = `${vh - 32}px`;
    if (panel.style.maxHeight !== maxH) panel.style.maxHeight = maxH;
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    let next;
    if (rect) {
      const below = rect.top + rect.height + 6 + 12;
      const above = rect.top - 6 - 12 - h;
      next = {
        top: below + h <= vh - 16 ? below : above >= 16 ? above : Math.max(16, vh - h - 16),
        left: Math.min(Math.max(16, rect.left + rect.width / 2 - w / 2), vw - w - 16),
      };
    } else {
      next = { top: Math.max(16, (vh - h) / 2), left: Math.max(16, (vw - w) / 2) };
    }
    setPos(prev => (prev && prev.top === next.top && prev.left === next.left ? prev : next));
  }, [open, ready, rect, step]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const release = trapFocus(panelRef.current);
    return () => {
      release();
      if (document.activeElement === document.body || !document.activeElement) findAnchor('nut-huong-dan')?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      focusedStepRef.current = -1;
      return;
    }
    if (pos && focusedStepRef.current !== step) {
      focusedStepRef.current = step;
      nextRef.current?.focus();
    }
  }, [open, step, pos]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft' && step > 0) onStep(step - 1);
      else return;
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  if (!open) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const visible = pos !== null;

  return (
    <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-labelledby="huong-dan-tieu-de">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-lg ring-2 ring-primary transition-all duration-200"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.72)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/70" />
      )}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`fixed flex w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl transition-opacity ${
          visible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ top: pos?.top ?? 0, left: pos?.left ?? 0 }}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
          <h2 id="huong-dan-tieu-de" className="text-sm font-bold text-t-primary">
            {current.tieuDe}
          </h2>
          <span className="text-[11px] text-t-micro">
            {step + 1}/{STEPS.length}
          </span>
          <button
            onClick={close}
            className="ml-auto text-t-micro transition-colors hover:text-t-primary"
            title="Đóng hướng dẫn (Esc)"
            aria-label="Đóng hướng dẫn"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3 text-[13px] leading-relaxed text-t-secondary">
          {current.noiDung}
        </div>
        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-card px-4 py-2.5">
          <div className="flex gap-1" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-4 bg-primary' : 'w-1.5 bg-border'}`}
              />
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            {step === 0 ? (
              <button
                onClick={close}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-t-muted hover:text-t-primary"
              >
                Bỏ qua
              </button>
            ) : (
              <button
                onClick={() => onStep(step - 1)}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-t-secondary hover:text-t-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                Quay lại
              </button>
            )}
            <button
              ref={nextRef}
              onClick={next}
              className="flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hover"
            >
              {isLast ? 'Bắt đầu đấu giá' : step === 0 ? 'Bắt đầu' : 'Tiếp'}
              {!isLast && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
