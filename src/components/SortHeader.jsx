import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

export default function SortHeader({ cot, nhan, sort, canPhai = false, className = '', le = 'px-3' }) {
  const active = sort.column === cot;
  return (
    <th
      className={`whitespace-nowrap ${le} py-2.5 text-[10px] font-semibold uppercase tracking-wide ${
        canPhai ? 'text-right' : 'text-left'
      } ${className}`}
      aria-sort={active ? (sort.direction === 'tang' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => sort.toggle(cot)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-t-primary ${
          active ? 'text-primary' : 'text-t-micro'
        } ${canPhai ? 'flex-row-reverse' : ''}`}
        title={`Sắp xếp theo ${nhan.toLowerCase()}`}
      >
        {nhan}
        {active ? (
          sort.direction === 'tang' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}
