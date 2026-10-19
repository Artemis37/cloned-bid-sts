import { useState } from 'react';

// Column sort state: clicking the active column flips direction, a new column starts ascending.
export function useSort(initial = null) {
  const [column, setColumn] = useState(initial);
  const [direction, setDirection] = useState('tang');
  return {
    column,
    direction,
    toggle(next) {
      if (column === next) setDirection(d => (d === 'tang' ? 'giam' : 'tang'));
      else {
        setColumn(next);
        setDirection('tang');
      }
    },
  };
}

export function sortRows(rows, column, direction, valueOf) {
  if (!column) return rows;
  const sign = direction === 'tang' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = valueOf(a, column);
    const y = valueOf(b, column);
    return typeof x === 'number' && typeof y === 'number'
      ? (x - y) * sign
      : String(x).localeCompare(String(y), 'vi', { numeric: true }) * sign;
  });
}

export function inPriceRange(price, from, to) {
  return !((from !== '' && price < Number(from)) || (to !== '' && price > Number(to)));
}
