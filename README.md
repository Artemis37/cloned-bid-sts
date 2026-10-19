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
- Prices are frozen at the snapshot time (`captured_at` in `auction.json`); there are no live updates.
- Follow (heart) is saved in the visitor's browser instead of on the server.
- The session switches to "ended" when the countdown reaches the deadline.
