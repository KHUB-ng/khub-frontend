# Deploying the KHUB frontend to Cloudflare Pages

KHUB has two separate deployables:
- **Frontend:** React/Vite static site hosted on Cloudflare Pages.
- **Backend:** Rust/Loco API hosted as a Rust service on a Rust-compatible host. Cloudflare Pages does not run the KHUB Rust API.

Node.js is required only by the frontend build tooling (Vite/npm). It is not the backend runtime.

## 1. Connect the frontend repository
1. Open Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Authorize GitHub if requested.
3. Select KHUB-ng/khub-frontend.
4. Use a preview branch for testing. Select main for production only after review and merge.

## 2. Configure the build

| Setting | Value |
|---|---|
| Framework preset | Vite (or None) |
| Root directory | / (repository root; leave empty if empty means root) |
| Build command | npm ci && npm run build |
| Build output directory | dist |
| Node.js version | 22.12.0 |

**Do not enter frontend as the root directory.** package.json is at the repository root. The earlier failure occurred because Cloudflare tried to change its working directory to /repo/frontend, which does not exist.

## 3. Add frontend environment variables

Open Settings → Environment variables. Add these for Production and Preview as appropriate:

| Variable | Value |
|---|---|
| VITE_API_BASE_URL | The deployed Rust API base URL, including /api, e.g. https://api.your-domain.example/api |
| VITE_GOOGLE_CLIENT_ID | Your Google OAuth Web Client ID |

Use your actual API hostname and OAuth client ID. Do not copy the example hostname literally.

Never put database passwords, Flutterwave secret keys, R2 access keys, JWT signing secrets, or other server secrets in VITE_* variables. Vite embeds VITE_* values into public browser assets.

## 4. Deploy the Rust backend separately

Deploy KHUB-ng/khub-backend as a Rust service on your chosen Rust-capable hosting provider. Configure its production database, application secrets, Flutterwave credentials, Google OAuth server-side client ID, and private R2/KYC bucket credentials there.

The backend's public HTTPS API URL is what belongs in VITE_API_BASE_URL. Run database migrations as part of the backend release process, with a database backup taken first. Confirm the API health endpoint works before deploying the frontend against it.

## 5. Configure backend CORS and OAuth

1. Allow the exact Cloudflare Pages production hostname in the backend CORS allow-list.
2. Add Cloudflare preview hostnames only if preview builds need to call the staging API.
3. Add the production and required preview hostnames to Google's authorised JavaScript origins.
4. Configure the backend server-side Google client ID to match the intended OAuth client.
5. Do not use wildcard credentialed CORS.

## 6. Verify the deployment

After saving settings, trigger Retry deployment or push a new commit. Confirm:
- Cloudflare build log shows the repository root, not /repo/frontend.
- npm ci completes successfully.
- npm run build completes successfully.
- Cloudflare publishes the dist directory.
- The site loads over HTTPS.
- Browser Network tools show API requests going to the Rust API hostname.
- Login, wallet, checkout and admin requests work against the staging API.
- No secrets appear in generated JavaScript bundles or browser source maps.

## 7. If deployment still fails

Open Workers & Pages → khub-frontend → Deployments → failed deployment → View build log. Copy the first actual error and the preceding 30–50 lines. A GitHub check that says only Build failed is not enough to identify a cause.

## Important deployment boundary

Cloudflare Pages builds and serves the React frontend. It does not turn the Rust backend into Node.js, and it does not host the backend simply because the frontend has a Node.js build command. Keep the Rust API deployment, database, private object storage, and secrets on backend infrastructure.