# KHUB — Frontend

The KHUB web client. One marketplace spanning shopping, jobs, rentals, services,
logistics and rides, backed by the Rust API in
[`KHUB-ng`/`khub-backend`](../khub-backend) (`https://api.khub.com.ng`).

This app is a **complete wrapper over the backend**: every route the API exposes
has a screen, and the only contract the app knows is
`khub-backend/docs/API.md`. Supabase and Paystack are gone — auth, escrow,
ledger, chat, notifications and admin all go through the Rust API.

---

## Architecture

```
browser  (khub.com.ng — or localhost:3000 in dev)
    │
    │  same-origin fetch
    ▼
┌───────────────────────────────────────────────────────────┐
│ frontend/src/api/        ← the ONLY place HTTP happens     │
│                                                           │
│   client.ts     bearer tokens · single-flight refresh     │
│                 {error, description} envelope             │
│   money.ts      naira strings out · kobo + display in     │
│   pagination.ts Page<T> envelope · keyset cursor          │
│   ws.ts         chat WebSocket (?token=)                  │
│   coverage.ts   manifest of all 138 routes (source of truth)│
│   registry.ts   request metadata, drives the audit         │
│                                                           │
│   auth · user · wallet · listings · orders · rides ·       │
│   deliveries · driver · agent · conversations ·            │
│   notifications · referrals · admin                        │
└───────────────────────────────────────────────────────────┘
    │
    │  https://api.khub.com.ng
    ▼
khub-backend (Rust · Loco · SQLite · Flutterwave · Brevo)
```

## Route coverage

`frontend/docs/BACKEND_SWAP.md` maps every former Supabase table to its endpoint
and lists the honest gaps. The live manifest is generated:

```bash
cd frontend
npm run coverage:md             # writes docs/API_COVERAGE.md from src/api/coverage.ts
node scripts/route-audit.mjs   # "is anything in the backend with no frontend?"
```

`route-audit` walks all 138 routes and names the screen that calls each one, so
an unwired route cannot hide. Current state: **137/138**. The one exception is
`POST /api/auth/google`, which the backend answers `503` for until
`GOOGLE_CLIENT_ID` is configured.

## Quickstart

| Task | Command |
|---|---|
| Install | `cd frontend && npm install` |
| Dev server | `npm run dev` → http://localhost:3000 |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` |
| Tests | `npm test` |
| Production build | `npm run build` |
| Route audit | `node scripts/route-audit.mjs` |
| Coverage manifest | `npm run coverage:md` |

### No env file needed in dev

`vite.config.ts` proxies `/api` to `https://api.khub.com.ng` **server-side**.
The backend hardcodes CORS to the `khub.com.ng` origins, so a localhost page
would be rejected on a direct call; the proxy removes that constraint with no
backend change. For a production build set:

```
VITE_API_BASE_URL=https://api.khub.com.ng
```

## Deploy

Cloudflare Pages builds from this repository using the standard Vite preset:

- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- SPA routing rules (`/* /index.html 200`) live in `frontend/public/_redirects`
  and are copied into `dist/` automatically during the build.

## Rules the API imposes on this app

1. **Money direction.** Send naira **strings** (`"1500.05"`), never JSON
   numbers. Receive `*_kobo` plus a ready `*_display` string — render that, do
   not recompute. See `src/api/money.ts`.
2. **Refresh tokens are booby-trapped.** Replaying a consumed refresh token
   revokes the whole family, so refreshes are **single-flight** inside
   `client.ts`. Never call refresh from a page.
3. **Two pagination shapes.** Browse returns `Page<T>`; feeds use keyset
   `?after=<id>&limit=`. `src/api/pagination.ts` has a helper for each.
4. **Creation is payment.** `POST /orders`, `/rides`, `/deliveries` debit the
   wallet into escrow in the same transaction — there is no separate card
   charge. Every one of those screens shows the balance and asks to confirm.
5. **Errors are `{error, description}`.** `503` means a provider is not
   configured — a server state, not a user error.
6. **Anti-enumeration.** Register / forgot / reset / magic-link always answer
   200. No screen may say "email already taken".

## What was removed, and why

Supabase and Paystack are deleted outright, along with every feature the
backend does not have: subscriptions and plans, promo codes, saved shipping
addresses, profile CV sections (skills, experience, education, languages), and
the unrouted staff portal. Nothing is mocked — a surface either calls the API
or is not in the app. Future work is tracked in
[`frontend/docs/ROADMAP.md`](frontend/docs/ROADMAP.md).

## Layout

```
frontend/
├── docs/                BACKEND_SWAP.md · API_COVERAGE.md · ROADMAP.md
├── scripts/             route-audit.mjs · wiring-audit.mjs
├── src/
│   ├── api/             typed client, one module per route group
│   ├── components/      UI, shadcn primitives, layout
│   ├── contexts/        Auth (JWT) · Cart (client-side) · Theme · Language
│   ├── pages/           one directory per backend route group
│   └── lib/
├── index.html
└── vite.config.ts       dev proxy → api.khub.com.ng
```
