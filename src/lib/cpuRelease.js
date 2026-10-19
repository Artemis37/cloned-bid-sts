// Launch month of each CPU model, keyed by the name cpuInfo() normalises to.
// Sources: Intel ARK, Intel/AMD/Apple/Samsung launch announcements, Wikipedia (Kaby Lake, Coffee Lake, Comet Lake, Tiger Lake).
// A model missing here counts as unknown, e.g. "i5-11200H", which Intel never made (likely a typo in the listing).
export const CPU_RELEASES = {
  'Samsung Exynos 7870 Octa': '2016-02',
  'i3-7100': '2017-01',
  'i5-7300HQ': '2017-01',
  'i7-7700HQ': '2017-01',
  'i5-8250U': '2017-08',
  'i5-8300H': '2018-04',
  'i7-8750H': '2018-04',
  'i5-9300H': '2019-04',
  'i7-9750H': '2019-04',
  'i7-9750HF': '2019-04',
  'i5-10210U': '2019-08',
  'Ryzen 5 4600H': '2020-03',
  'Ryzen 7 4800H': '2020-03',
  'i5-10300H': '2020-04',
  'i7-10750H': '2020-04',
  'i5-1135G7': '2020-09',
  'i5-10200H': '2020-09',
  'i5-10500H': '2020-10',
  'Apple M1': '2020-11',
  'i5-11300H': '2021-01',
  'Ryzen 7 5800H': '2021-01',
  'i7-11800H': '2021-05',
  'i5-1155G7': '2021-05',
  'i5-11320H': '2021-06',
};

// Intel 7th gen and older aren't on Microsoft's list of CPUs supported by Windows 11.
const NOT_WINDOWS_11 = new Set(['i3-7100', 'i5-7300HQ', 'i7-7700HQ']);

// { year: 2019.25, label: '04/2019', windows11: true } or null when the launch date is unknown.
export function cpuRelease(model) {
  const month = CPU_RELEASES[model];
  if (!month) return null;
  const [y, m] = month.split('-').map(Number);
  return { year: y + (m - 1) / 12, label: `${String(m).padStart(2, '0')}/${y}`, windows11: !NOT_WINDOWS_11.has(model) };
}
