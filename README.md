# KHUB Frontend

React 19 + Vite 8 frontend for the KHUB marketplace and role workspaces. The interface preserves the supplied Figma visual direction and uses the KHUB API for account, listing, commerce, logistics and administration data.

## Local development

- Node.js 22 (see `.nvmrc`)
- `npm ci`
- Copy `.env.example` to `.env.local` and set the public frontend configuration
- `npm run dev`
- `npm run build` for the production bundle

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Public API origin including the `/api` prefix; defaults to `https://api.khub.com.ng/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google Identity Services OAuth web client ID; public identifier only |

Never put Flutterwave secret keys, Google client secrets, database credentials, R2 keys, JWT secrets or other private credentials in any `VITE_*` variable. Those belong in the backend hosting environment.

## Deploy to Cloudflare Pages

1. In Cloudflare Pages, set the project root directory to `/` (the Vite `package.json` is at the repository root).
2. Set the build command to `npm ci && npm run build` and the build output directory to `dist`.
3. Set `NODE_VERSION=22.12.0` in the Pages build environment. `.nvmrc` and `.node-version` also pin this compatible Node release.
4. Add `VITE_API_BASE_URL` and `VITE_GOOGLE_CLIENT_ID` to the Pages environment settings for each environment.
5. Configure the matching frontend origin in backend CORS and in the Google OAuth authorised JavaScript origins.
6. The `public/_redirects` file provides the SPA fallback. `wrangler.toml` declares the Pages output directory.

## Deploy to Vercel

1. Import the frontend repository into Vercel and select Vite as the framework preset.
2. Set the build command to `npm run build` and output directory to `dist`.
3. Set Node.js 22 and add `VITE_API_BASE_URL` and `VITE_GOOGLE_CLIENT_ID` for Preview and Production separately.
4. Add each deployed frontend origin to backend CORS and Google OAuth authorised JavaScript origins.
5. `vercel.json` supplies SPA rewrites and baseline response headers.

## Integrated features

- Backend email/password, verification, password reset and Google ID-token sign-in
- Live product, service, rental and job listing discovery, detail views and related listings
- Wishlist, stock-aware multi-item checkout, wallet and Flutterwave server verification
- Ride and delivery requests, route previews, driver/agent location sharing and authenticated tracking snapshots
- Admin queues for KYC, payouts, users, listings, drivers, delivery agents and sponsored placements
- Sponsored listing requests, admin approval and public placements; proposed ad budgets are not charged by the current workflow
- New-arrival and trending shelves; trending is ranked by wishlist saves

## Production checklist

The feature branches are implementation branches, not a deployment approval. Before production use:

- Configure the production API, CORS, OAuth origins, payment, email, storage and monitoring secrets on the backend host.
- Provision the private KYC bucket, migrate all legacy KYC files from the public bucket, verify object counts/checksums and remove public copies.
- Complete rate limiting, security-header/CSP review, dependency and security scans, backup restore drills and load tests.
- Complete Flutterwave sandbox and live acceptance tests, webhook replay tests and finance reconciliation.
- Complete commission general-ledger and payout reconciliation before enabling commission rules.
- Complete buyer, seller, service provider, job poster, driver, delivery agent and administrator acceptance tests.
- Have the Privacy, Refund, Terms, Cancellation and Advertising policies reviewed against KHUB's actual legal entity and operating practices.

No deployment is performed by this repository's feature-branch work.
