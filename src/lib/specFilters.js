// Hardware filters (RAM, CPU, GPU, storage, screen): option lists with counts, and matching.
// Each filter's value is 'all' or one of the option values built here.
import { CPU_FAMILY_ORDER, GPU_BRAND_ORDER, cpuInfo, gpuInfo, screenInches, sizeGb, storageInfo } from './asset.js';

export const NO_SPEC_FILTERS = { ram: 'all', cpu: 'all', gpu: 'all', storage: 'all', screen: 'all' };

// Storage totals are irregular ("256GB + 240GB"), so storage filters by range.
const STORAGE_RANGES = [
  { value: 'lt128', label: 'Dưới 128GB', test: gb => gb < 128 },
  { value: '128-256', label: '128GB - 256GB', test: gb => gb >= 128 && gb < 300 },
  { value: '480-512', label: '480GB - 512GB', test: gb => gb >= 300 && gb < 800 },
  { value: 'gte1tb', label: 'Từ 1TB trở lên', test: gb => gb >= 800 },
];
const STORAGE_MISSING = 'missing';

function countBy(assets, keyOf) {
  const counts = new Map();
  for (const a of assets) {
    const key = keyOf(a);
    if (key != null) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

// Groups exact models by family/brand in `order`; models sorted newest/biggest number first.
function groupModels(assets, infoOf, groupKey, order) {
  const groups = new Map();
  for (const a of assets) {
    const info = infoOf(a);
    if (!info?.model) continue;
    const key = info[groupKey];
    if (!groups.has(key)) groups.set(key, new Map());
    const models = groups.get(key);
    models.set(info.model, (models.get(info.model) || 0) + 1);
  }
  const rank = model => Number(model.match(/\d{3,5}/)?.[0] ?? -1) + (/ Ti$/.test(model) ? 0.5 : 0);
  return order
    .filter(key => groups.has(key))
    .map(key => {
      const models = [...groups.get(key)].sort((x, y) => rank(y[0]) - rank(x[0]) || x[0].localeCompare(y[0]));
      return { label: key, total: models.reduce((n, [, count]) => n + count, 0), models };
    });
}

export function specFilterOptions(assets) {
  const gpus = assets.map(a => gpuInfo(a.spec?.gpu)).filter(Boolean);
  const storages = assets.map(a => storageInfo(a.spec?.storage_gb)).filter(Boolean);
  return {
    ram: [...countBy(assets, a => sizeGb(a.spec?.ram))].sort((x, y) => x[0] - y[0]),
    cpu: groupModels(assets, a => cpuInfo(a.spec?.cpu), 'family', CPU_FAMILY_ORDER),
    gpu: {
      discrete: gpus.filter(g => g.discrete).length,
      integrated: gpus.filter(g => !g.discrete).length,
      groups: groupModels(assets, a => gpuInfo(a.spec?.gpu), 'brand', GPU_BRAND_ORDER),
    },
    storage: [
      ...STORAGE_RANGES.map(r => [r.value, r.label, storages.filter(s => s.gb != null && r.test(s.gb)).length]),
      [STORAGE_MISSING, 'Không có / hỏng ổ cứng', storages.filter(s => s.missing).length],
    ].filter(([, , n]) => n > 0),
    screen: [...countBy(assets, a => screenInches(a.spec?.screen_size))].sort((x, y) => x[0] - y[0]),
  };
}

function matchesCpu(asset, value) {
  const cpu = cpuInfo(asset.spec?.cpu);
  if (!cpu) return false;
  return value.startsWith('family:') ? cpu.family === value.slice('family:'.length) : cpu.model === value;
}

function matchesGpu(asset, value) {
  const gpu = gpuInfo(asset.spec?.gpu);
  if (!gpu) return false;
  if (value === 'discrete') return gpu.discrete;
  if (value === 'integrated') return !gpu.discrete;
  return gpu.model === value;
}

function matchesStorage(asset, value) {
  const storage = storageInfo(asset.spec?.storage_gb);
  if (!storage) return false;
  if (value === STORAGE_MISSING) return !!storage.missing;
  const range = STORAGE_RANGES.find(r => r.value === value);
  return storage.gb != null && range.test(storage.gb);
}

export function matchesSpecFilters(asset, f) {
  return (
    (f.ram === 'all' || String(sizeGb(asset.spec?.ram)) === f.ram) &&
    (f.cpu === 'all' || matchesCpu(asset, f.cpu)) &&
    (f.gpu === 'all' || matchesGpu(asset, f.gpu)) &&
    (f.storage === 'all' || matchesStorage(asset, f.storage)) &&
    (f.screen === 'all' || String(screenInches(asset.spec?.screen_size)) === f.screen)
  );
}
