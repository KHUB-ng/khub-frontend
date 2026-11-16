# Cloudflare Pages deployment

The Vite application is located at the repository root. There is no
`frontend/` subdirectory.

## Cloudflare Pages build settings

Set the Pages project's Root directory (advanced) to the repository root:
leave the field blank (recommended) or set it to `/`. Do not set it to
`frontend`.

Use these build settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | Repository root (blank or `/`) |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Node.js version | `22.12.0` |

The root `wrangler.toml` records the Pages project name, compatibility
date and output directory. It does not override the dashboard's
Root directory (advanced) path. That setting must be corrected in
Cloudflare Pages if it currently points to `frontend`.

## Required public build variables

Configure these in the Cloudflare Pages environment settings:

- `VITE_API_BASE_URL`: the public KHUB API base URL
- `VITE_GOOGLE_CLIENT_ID`: the public Google OAuth client ID

Never put private API keys, database credentials, storage secrets or
OAuth client secrets in a `VITE_*` variable. Vite exposes those values
to browser code.

## Verify the deployment

After correcting the Root directory setting and pushing to `main`,
open the latest deployment's build log. Confirm that:

1. The checkout completes without a `Cannot find cwd: .../frontend` error.
2. Dependencies install from the repository-root `package-lock.json`.
3. `npm run build` completes successfully.
4. The `dist` directory is uploaded as the Pages artifact.
