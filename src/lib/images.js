// Product photos come from the images/ folder at build time:
//   images/<SKU>/            photos of one specific unit (used first if present)
//   images/<model folder>/   shared by every product name listed for that folder in src/data/image-groups.json
//   images/<product name>/   fallback for names not in image-groups.json (Windows-illegal characters become "-")
// Files are shown in file-name order (01.jpg, 02.jpg, ...).
import { modelOf } from './models.js';

// Vite needs the glob patterns written inline, so the two calls repeat them.
const large = import.meta.glob('/images/**/*.{jpg,jpeg,png,webp,gif,avif,JPG,JPEG,PNG,WEBP,GIF,AVIF}', {
  eager: true,
  query: '?img=1600',
  import: 'default',
});
const thumbs = import.meta.glob('/images/**/*.{jpg,jpeg,png,webp,gif,avif,JPG,JPEG,PNG,WEBP,GIF,AVIF}', {
  eager: true,
  query: '?img=240',
  import: 'default',
});

const byFolder = new Map();
const paths = Object.keys(large).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
for (const p of paths) {
  const rel = p.slice('/images/'.length);
  const slash = rel.indexOf('/');
  // Loose files directly in images/ belong to no product; null means the build skipped an unreadable file.
  if (slash < 0 || !large[p] || !thumbs[p]) continue;
  const folder = rel.slice(0, slash);
  if (!byFolder.has(folder)) byFolder.set(folder, []);
  byFolder.get(folder).push({ src: large[p], thumb: thumbs[p] });
}

function folderNameFor(productName) {
  return productName
    .trim()
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/[. ]+$/, '');
}

export function imagesFor(asset) {
  const name = asset.name.trim();
  return byFolder.get(asset.sku) ?? byFolder.get(modelOf(name)) ?? byFolder.get(folderNameFor(name)) ?? [];
}
