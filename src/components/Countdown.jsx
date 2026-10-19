import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

function useRemaining(deadline) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!deadline) {
      setText('');
      return;
    }
    const tick = () => {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) {
        setText('Đã kết thúc');
        return;
      }
      const days = Math.floor(ms / 864e5);
      const pad = n => String(n).padStart(2, '0');
      setText(
        `${days > 0 ? days + ' ngày ' : ''}${pad(Math.floor((ms % 864e5) / 36e5))}:${pad(
          Math.floor((ms % 36e5) / 6e4),
        )}:${pad(Math.floor((ms % 6e4) / 1e3))}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return text;
}

export default function Countdown({ deadline, dongRoi, className = '', ...rest }) {
  const remaining = useRemaining(deadline);
  const text = dongRoi ? 'Đã kết thúc' : remaining;
  const parts = text.match(/^(\d+ ngày) (.+)$/);
  return (
    <div
      {...rest}
      className={`flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-2 text-[28px] font-bold leading-tight tabular-nums text-danger ${className}`}
      title={deadline ? `Kết thúc: ${new Date(deadline).toLocaleString('vi-VN')}` : undefined}
    >
      <Clock className="h-8 w-8 shrink-0" />
      <span className="flex flex-wrap items-baseline gap-x-2">
        {parts ? (
          <>
            <span className="whitespace-nowrap">{parts[1]}</span>
            <span className="whitespace-nowrap">{parts[2]}</span>
          </>
        ) : (
          <span className="whitespace-nowrap">{text || '--:--:--'}</span>
        )}
      </span>
    </div>
  );
}
