import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sharp from 'sharp';

// Handles imports like `photo.jpg?img=1600`: the build gets a WebP at most 1600px wide,
// dev serves the original file. Originals in images/ are never modified.
function productImages() {
  let root = '';
  let isBuild = false;
  return {
    name: 'product-images',
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
      isBuild = config.command === 'build';
    },
    async load(id) {
      const [file, query = ''] = id.split('?');
      const width = Number(new URLSearchParams(query).get('img'));
      if (!width) return null;
      if (!isBuild) {
        const url = '/' + path.relative(root, file).split(path.sep).map(encodeURIComponent).join('/');
        return `export default ${JSON.stringify(url)};`;
      }
      const rel = path.relative(path.join(root, 'images'), file);
      let source;
      try {
        source = await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      } catch (err) {
        // A broken or unsupported file (e.g. HEIC renamed to .jpg) is skipped instead of failing the build.
        this.warn(`Skipping images/${rel.split(path.sep).join('/')}: ${err.message}`);
        return 'export default null;';
      }
      const name = rel.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-') + `-${width}.webp`;
      const ref = this.emitFile({ type: 'asset', name, source });
      return `export default import.meta.ROLLUP_FILE_URL_${ref};`;
    },
  };
}

export default defineConfig({
  plugins: [productImages(), react()],
});
