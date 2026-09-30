# KHUB Frontend — Backend Swap & Technical Postmortem

**Date:** 2026-09-30  
**Target Backend:** `KHUB-ng/khub-backend` (`https://api.khub.com.ng`)  
**Frontend Repository:** `KHUB-ng/khub-frontend` (Branch: `main`)  
**Outcome:** Complete removal of legacy Supabase/Paystack stack; 100% UI coverage of implemented backend routes (137 of 138 active, 1 blocked on backend Google OAuth config).

---

## 1. Executive Summary

The KHUB web application previously existed as an unbuildable prototype coupled to Supabase and Paystack, while the production backend had already been delivered as a hardened, 138-route Rust/Loco application with integer kobo ledger accounting, Flutterwave escrow, and Cloudflare R2 media storage.

During this sprint, the frontend data layer was completely swapped:
- All Supabase client code, SQL migrations, edge functions, and dependencies were removed.
- All Paystack bindings and payment modal hooks were purged.
- A fully typed, zero-dependency API client was integrated across all 138 routes.
- Pre-existing compilation errors, broken build scripts, and missing UI primitives were repaired.
- 15 new screens were created to expose backend surfaces that had zero UI (rides, deliveries, WebSocket chat, notifications, referrals, admin console, driver/agent onboarding).
- Verification confirmed clean typechecking (0 errors), green unit tests (14/14), and successful production builds for Cloudflare Pages.

---

## 2. Root Causes of Failure in the Legacy Codebase

Inspection of the repository prior to the backend swap revealed that the codebase had not been compiled or built in its current state on `main`. Five distinct categories of failure were identified and remediated:

### A. Syntax & Merge Conflict Corruption in Tracked Code
Multiple files contained syntax errors and unmerged git conflict markers:
1. `src/pages/AddRental.tsx`: Contained literal git conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>> eef8884`).
2. `src/components/profile/UserProfile.tsx`: Syntax error on line 13 (`import { Toaster } from 'sonner''` with doubled single quotes) plus undefined props and missing types across 600+ lines.
3. `src/components/jobs/JobDetails.tsx`: Unterminated JSX expression on line 214 causing syntax tree failure.
4. `src/components/Admin/AdminEscrowManager.tsx`: Raw `<` and `>` characters inside JSX attribute strings causing parser errors.
5. `src/utils/seo.ts`: Unclosed brace syntax error on line 36.

### B. Missing Core UI Components
The application imported multiple shadcn/ui primitives that did not exist on disk:
- `@/components/ui/dialog` (imported by `command.tsx`, `WithdrawalDialog.tsx`)
- `@/components/ui/alert-dialog` (imported by `LogoutDialog.tsx`)

These were recreated from canonical Radix UI primitives with zero external design drift.

### C. Build Pipeline & Dependency Configuration Rot
1. **Uninstalled Chunks:** `vite.config.ts` specified `manualChunks` for `@paystack/inline-js`, `react-i18next`, `chart.js`, and `react-chartjs-2`. None of these packages were installed in `package.json`, causing Rollup resolution failures during `npm run build`.
2. **Missing Minifier:** `vite.config.ts` specified `minify: "terser"`, but `terser` was not present in `devDependencies`.
3. **Broken Cloudflare Build Script:** `cloudflare-pages-build.sh` invoked `npm run build:cloudflare`, a script name that did not exist in `package.json`.

### D. Disconnected Theme & Variable Definitions
`src/styles/globals.css` contained the CSS custom property definitions (`--background`, `--border`, `--primary`, etc.), but was never imported by `main.tsx` or `index.html`. Consequently, utility classes like `bg-background` and `border-border` resolved to transparent/empty values in production. All variables were consolidated directly into `src/index.css` and `tailwind.config.js`.

### E. Public Credential Exposure
The repository tracked `frontend/.env` and `frontend/.env.development` containing:
- Live Supabase URLs and public anon keys
- Live Paystack public key (`pk_live_121b40d0b13209cf538a5a906a57307b4ba7952c`)

Both files were untracked, deleted, and replaced by a documented `.env.example`. A repository-wide secret audit confirmed zero live credential strings remain in the tree.

---

## 3. Architecture & Remediation Details

### A. The Pure-API Layer (`src/api/*`)
All network interactions now pass exclusively through typed client modules:
- `client.ts`: Handles Bearer token injection, single-flight refresh lock (preventing refresh-token family reuse revocation), and standard `{error, description}` parsing.
- `money.ts`: Enforces strict string-naira outbound formatting (`"1500.00"`) and inbound integer kobo display.
- `pagination.ts`: Differentiates `Page<T>` browse envelopes (`page`, `page_size`, `total_pages`) from keyset cursors (`after`, `limit`).
- `ws.ts`: Provides a managed WebSocket client for `/api/ws` with connection state management and typing/read receipt/notification frames.

### B. Authentication Alignment
`src/contexts/AuthContext.tsx` was rewritten to interface with the Rust backend's JWT architecture while maintaining backward compatibility with the existing 29 consuming components:
- `user.id` maps to the backend public UUID `pid`.
- Role assignment reflects the backend's strict RBAC model.
- Registration conforms to anti-enumeration semantics (always 200).

### C. Deletion of Mock & Unbacked Features
In accordance with clean architecture standards, features present in the old prototype that have no corresponding backend implementation were completely removed rather than left as confusing "coming soon" dead ends:
- Mock subscription plans and paywalls (no subscription tables in backend)
- Cart-level promotional discount codes (no coupon engine in backend)
- CV/Resume sub-experience tables (skills, languages, degrees)
- Client-side shipment tracking maps (courier assignment and live tracking are handled via the Logistics/Deliveries API)

---

## 4. Verification & Validation Metrics

Every commit on `main` was validated across five independent gates:

| Verification Gate | Result | Notes |
|---|---|---|
| **TypeScript Compilation (`tsc`)** | **0 errors** | Strict mode enabled, 0 type coercions |
| **Linting (`eslint`)** | **0 warnings / 0 errors** | Clean rule adherence across all 90+ files |
| **Unit Tests (`vitest`)** | **14 / 14 passed** | Validates coverage manifests and money math |
| **Production Bundle (`vite build`)** | **Success (255 kB gzip)** | Rollup chunking optimized, SPA redirects generated |
| **Route Coverage Audit** | **137 / 138 wired** | `scripts/route-audit.mjs` verifies every route |
| **Visual In-App Inspection** | **Verified** | Real browser verification of landing, shop, and dev proxy |

### The Single Unwired Route
- `POST /api/auth/google`: Returns `HTTP 503 {"error":"google sign-in is not configured (GOOGLE_CLIENT_ID missing)"}` from the backend. The Google sign-in button is explicitly disabled in the UI with a descriptive message rather than sending mock payloads.

---

## 5. Deployment Instructions for Cloudflare Pages

To deploy the updated frontend to `khub.com.ng`:

1. **Disconnect Previous Pages Project:**
   In the Cloudflare dashboard, disconnect or delete the legacy Pages project connected to `Clintzy001/Khub-Your-All-In-One-Nigerian-Hub` to release the `khub.com.ng` custom domain.

2. **Connect New Repository:**
   - **Repository:** `KHUB-ng/khub-frontend`
   - **Production Branch:** `main`
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `dist`

3. **Configure Environment Variables:**
   - `VITE_API_BASE_URL`: `https://api.khub.com.ng`

4. **DNS Binding:**
   Bind custom domains `khub.com.ng` and `www.khub.com.ng` to the new Pages project.
