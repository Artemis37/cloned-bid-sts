# STS Bid (static copy)

Static React copy of the "Đấu giá" tab of https://bid.saigontechnology.vn/. No server or database: the auction
data is a snapshot in `src/data/auction.json`, the rules in `src/data/noi-quy.json`, and the styling is the
original site's compiled CSS (`src/styles/app.css`).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Deploy to Netlify

- Git-connected site: push this folder; `netlify.toml` already sets `npm run build` and publishes `dist`.
- Drag and drop: run `npm run build` and drop the `dist` folder on https://app.netlify.com/drop.

## Product images

Photos live in `images/`, one folder per model. Every product that is that model shares the folder, so
the 68 MSI GF63 units (many different names and SKUs) all show `images/MSI GF63 Thin/`. Which product names belong to which folder
is listed in `src/data/image-groups.json`.

- Add photos: drop `.jpg`, `.png` or `.webp` files into the folder. They show in file-name order (`01.jpg`,
  `02.jpg`, ...). Any size is fine: the build resizes them to WebP (max 1600px) and leaves your originals alone.
- Photos of one specific unit: create `images/<SKU>/` (e.g. `images/2103HLNNJQ/`). That unit then shows those
  photos instead of the model folder.
- Move a product to another model: move its name between lists in `src/data/image-groups.json`.
- A new product name that isn't in `image-groups.json` uses a folder with exactly its name (characters Windows
  doesn't allow in folder names, like `"` and `/`, become `-`).
- Run `npm run build` (or keep `npm run dev` running) to see changes. iPhone `.heic` photos aren't supported;
  export them as JPEG. Unreadable files are skipped with a warning.

## "Gợi ý dễ thắng" (suggestions)

The switch in the filter bar keeps only items in good shape and ranks them, per category, by how likely they are to
be won at a fair price. The detail popup always has a "Phân tích gợi ý" section with the reasons and every unit of the
same model (click one to open it).

- Eligible: status "Bình thường" and, for laptops/phones/tablets, battery above 50%. Everything else is left out
  with the reason shown in its popup.
- Score (0-100) = condition 40% + chance to win 40% + price 20%:
  - Condition: battery 50% → 100% scaled, charger included, RAM/storage vs the model's most common config.
  - Chance to win: bid count, estimated bidders (emails are masked to one letter, so it's approximate), quick
    outbids between different people within 10 minutes, how recent the last bid was (relative to the crawl time).
  - Price: current vs suggested price (with a CFO-approval warning below it), and vs same-model units.
- All thresholds and weights are in `src/lib/insights-config.js`; the logic is in `src/lib/insights.js`.
- Everything is computed in the browser from `src/data/auction.json`, so `npm run crawl` + `npm run build`
  refreshes the suggestions. The summary shows the crawl time; bids placed after it aren't reflected.

## Refresh the data

Prices change until the auction closes. To take a new snapshot (VPN required):

```bash
npm run crawl      # opens Chrome; sign in with Microsoft the first time
npm run build      # then redeploy
```

The crawl drops the "your bid" markers, so the copy never reveals which bids belong to whoever ran it.

## Differences from the original

- Only the "Đấu giá" tab; no account menu.
- "Xác nhận đặt giá" shows a notice instead of placing a bid.
- The detail popup shows product photos from `images/` (the original has none).
- Prices are frozen at the snapshot time (`captured_at` in `auction.json`); there are no live updates.
- Follow (heart) is saved in the visitor's browser instead of on the server.
- The session switches to "ended" when the countdown reaches the deadline.
