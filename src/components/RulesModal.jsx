import { useEffect, useRef } from 'react';
import { ScrollText, TriangleAlert, X } from 'lucide-react';
import { trapFocus } from '../lib/focusTrap.js';
import noiQuy from '../data/noi-quy.json';

const TAG_CLASSES = {
  xanh: 'bg-success/10 text-success border border-success/30',
  cam: 'bg-warning/15 text-warning border border-warning/40',
  do: 'bg-danger/15 text-danger border border-danger/40',
};

// Renders **bold** segments.
function richText(text, keyPrefix) {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => (i % 2 === 1 ? <strong key={`${keyPrefix}-${i}`}>{part}</strong> : <span key={`${keyPrefix}-${i}`}>{part}</span>));
}

function Paragraph({ text, k }) {
  const tagged = text.match(/^\[(xanh|cam|do)\]\s*([^|]+)\|\s*(.*)$/);
  if (tagged) {
    const [, color, label, rest] = tagged;
    return (
      <div className="flex gap-2">
        <span className={`mt-0.5 shrink-0 self-start rounded px-1.5 py-0.5 text-[11px] font-medium ${TAG_CLASSES[color]}`}>
          {label.trim()}
        </span>
        <span>{richText(rest, k)}</span>
      </div>
    );
  }
  if (text.startsWith('- ')) {
    return (
      <div className="flex gap-2 pl-1">
        <span className="shrink-0">-</span>
        <span>{richText(text.slice(2), k)}</span>
      </div>
    );
  }
  return <p>{richText(text, k)}</p>;
}

function Section({ muc, k }) {
  const paragraphs = muc.doan || [];
  if (muc.canh_bao) {
    return (
      <section className="break-inside-avoid rounded-lg border-2 border-danger/50 bg-danger/10 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-danger">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {muc.tieu_de}
        </h3>
        <div className="mt-2 space-y-2 text-[13px] font-semibold leading-relaxed text-danger">
          {paragraphs.map((p, i) => (
            <Paragraph key={i} text={p} k={`${k}-${i}`} />
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="break-inside-avoid">
      <h3 className="text-sm font-semibold text-t-primary">{muc.tieu_de}</h3>
      <div className="mt-1.5 space-y-1.5 text-[13px] leading-relaxed text-t-secondary">
        {paragraphs.map((p, i) => (
          <Paragraph key={i} text={p} k={`${k}-${i}`} />
        ))}
      </div>
    </section>
  );
}

export default function RulesModal({ onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!panelRef.current) return;
    const release = trapFocus(panelRef.current);
    return () => release();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="noi-quy-tieu-de"
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl outline-none"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
          <ScrollText className="h-4 w-4 text-primary" />
          <h2 id="noi-quy-tieu-de" className="text-sm font-bold text-t-primary">
            Nội quy đấu giá tài sản thanh lý
          </h2>
          {noiQuy.phien_ban && <span className="text-[11px] text-t-micro">bản {noiQuy.phien_ban}</span>}
          <button
            onClick={onClose}
            className="ml-auto text-t-micro transition-colors hover:text-t-primary"
            title="Đóng"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        >
          <div className="lg:columns-2 lg:gap-9 lg:[column-rule:1px_solid_#475569] [&_section]:mb-5">
            {noiQuy.muc?.length ? (
              <div className="space-y-5">
                {noiQuy.muc.map((muc, i) => (
                  <Section key={i} muc={muc} k={`m${i}`} />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-t-muted">Chưa có nội dung nội quy.</p>
            )}
          </div>
        </div>
        <div className="shrink-0 border-t border-border bg-card px-5 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-t-secondary transition-colors hover:text-t-primary"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
