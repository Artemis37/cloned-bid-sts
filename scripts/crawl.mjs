// Refreshes src/data from the live site. Opens Chrome; sign in with Microsoft if asked (VPN required).
// Usage: npm run crawl
// To reuse an already-open Chrome started with --remote-debugging-port=9333: CDP_URL=http://127.0.0.1:9333 npm run crawl
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://bid.saigontechnology.vn';
const API = `${SITE}/api/backend/api/v1`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const LOGIN_TIMEOUT_MS = 10 * 60 * 1000;

async function openPage() {
  if (process.env.CDP_URL) {
    const browser = await chromium.connectOverCDP(process.env.CDP_URL);
    const page = await browser.contexts()[0].newPage();
    return { page, close: () => page.close() };
  }
  const context = await chromium.launchPersistentContext(path.join(ROOT, '.crawl-profile'), {
    channel: 'chrome',
    headless: false,
    viewport: null,
  });
  const page = context.pages()[0] ?? (await context.newPage());
  return { page, close: () => context.close() };
}

const { page, close } = await openPage();
try {
  await page.goto(SITE, { waitUntil: 'load' });
  console.log('Waiting for sign-in (if the browser shows the login page, sign in there)...');
  await page.waitForURL(url => url.origin === SITE && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/api/auth'), {
    timeout: LOGIN_TIMEOUT_MS,
  });

  const fetchJson = endpoint =>
    page.evaluate(async url => {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
      return res.json();
    }, `${API}${endpoint}`);

  const active = await fetchJson('/auctions/active');
  const rules = await fetchJson('/noi-quy');
  if (!active?.assets?.length) throw new Error('No active auction returned; data files left unchanged.');

  // Drop per-user fields: "la_ban" marks the signed-in user's own bids.
  const auction = {
    ...active,
    captured_at: new Date().toISOString(),
    assets: active.assets.map(a => ({ ...a, bids: (a.bids || []).map(b => ({ ...b, la_ban: false })) })),
  };
  fs.writeFileSync(path.join(DATA_DIR, 'auction.json'), JSON.stringify(auction, null, 2) + '\n');
  fs.writeFileSync(
    path.join(DATA_DIR, 'noi-quy.json'),
    JSON.stringify({ phien_ban: rules.phien_ban, muc: rules.muc }, null, 2) + '\n',
  );
  console.log(`Saved ${auction.assets.length} assets from "${auction.name}" at ${auction.captured_at}.`);
} catch (err) {
  console.error(err.message || err);
  process.exitCode = 1;
} finally {
  await close();
}
// A CDP connection keeps Node alive; exit explicitly without closing the user's browser.
process.exit();
