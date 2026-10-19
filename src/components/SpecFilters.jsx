// Hardware filters row: RAM, CPU, GPU, storage, screen. `values` uses the keys of NO_SPEC_FILTERS.
function selectClass(active) {
  return `flex-1 sm:flex-none rounded-lg border bg-surface px-3 py-2 text-xs focus:outline-none ${
    active ? 'border-primary/40 text-primary' : 'border-border text-t-secondary'
  }`;
}

function ModelGroups({ groups, groupAllLabel }) {
  return groups.map(g => (
    <optgroup key={g.label} label={`${g.label} (${g.total})`}>
      {groupAllLabel && g.models.length > 1 && g.label !== 'Khác' && (
        <option value={`family:${g.label}`}>
          {groupAllLabel} {g.label} ({g.total})
        </option>
      )}
      {g.models.map(([model, n]) => (
        <option key={model} value={model}>
          {model} ({n})
        </option>
      ))}
    </optgroup>
  ));
}

export default function SpecFilters({ options, values, onChange }) {
  const bind = key => ({
    value: values[key],
    onChange: e => onChange(key, e.target.value),
    className: selectClass(values[key] !== 'all'),
  });
  return (
    <div className="flex w-full flex-wrap gap-2">
      <select {...bind('ram')} title="Lọc theo dung lượng RAM">
        <option value="all">RAM</option>
        {options.ram.map(([gb, n]) => (
          <option key={gb} value={String(gb)}>
            {gb}GB ({n})
          </option>
        ))}
      </select>
      <select {...bind('cpu')} title="Lọc theo CPU: cả dòng (vd. Core i7) hoặc đúng model">
        <option value="all">CPU</option>
        <ModelGroups groups={options.cpu} groupAllLabel="Tất cả" />
      </select>
      <select {...bind('gpu')} title="Lọc theo card đồ hoạ">
        <option value="all">Card đồ hoạ</option>
        <option value="discrete">Có card rời ({options.gpu.discrete})</option>
        <option value="integrated">Không có card rời ({options.gpu.integrated})</option>
        <ModelGroups groups={options.gpu.groups} />
      </select>
      <select {...bind('storage')} title="Lọc theo tổng dung lượng ổ cứng">
        <option value="all">Ổ cứng</option>
        {options.storage.map(([value, label, n]) => (
          <option key={value} value={value}>
            {label} ({n})
          </option>
        ))}
      </select>
      <select {...bind('screen')} title="Lọc theo kích thước màn hình">
        <option value="all">Màn hình</option>
        {options.screen.map(([inches, n]) => (
          <option key={inches} value={String(inches)}>
            {inches}" ({n})
          </option>
        ))}
      </select>
    </div>
  );
}
