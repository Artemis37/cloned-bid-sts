import { useState } from 'react';
import { CircleHelp, Gavel, ScrollText } from 'lucide-react';
import RulesModal from './RulesModal.jsx';
import Tour from './Tour.jsx';

export default function Nav() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [tourStep, setTourStep] = useState(-1);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-surface border-b border-border px-3 sm:px-6 flex items-center h-12 gap-1 min-w-0">
        <span className="text-[13px] font-bold text-primary mr-1 sm:mr-4 flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <Gavel className="w-4 h-4" />
          <span className="hidden md:inline">Saigon Technology</span>
        </span>
        <div className="flex min-w-0 overflow-x-auto">
          <a
            href="/"
            className="whitespace-nowrap px-2.5 sm:px-4 py-3 text-xs font-medium border-b-2 transition-colors text-primary border-primary"
          >
            <span className="sm:hidden">Đấu giá</span>
            <span className="hidden sm:inline">Đấu giá</span>
          </a>
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => setTourStep(0)}
            data-huong-dan="nut-huong-dan"
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-t-secondary transition-colors hover:text-t-primary"
            title="Hướng dẫn sử dụng"
            aria-label="Hướng dẫn sử dụng"
          >
            <CircleHelp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>
          <button
            onClick={() => setRulesOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-t-secondary transition-colors hover:text-t-primary"
            title="Đọc lại nội quy đấu giá"
            aria-label="Đọc lại nội quy đấu giá"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nội quy</span>
          </button>
        </div>
      </nav>
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
      <Tour step={tourStep} onStep={setTourStep} />
    </>
  );
}
