# Frontend roadmap

What this app cannot show yet, and why. Every item here is **blocked on backend
work**, not on UI work — the moment the route exists, the screen is small
because the typed client and `route-audit` already carry the metadata.

Rule for this file, borrowed from the backend's own gap ledger: nothing sits in
limbo. Each row names the owning backend work and the frontend change that
follows it.

| # | Missing surface | Blocked on | Frontend work once unblocked |
|---|---|---|---|
| 1 | **Google sign-in** | `GOOGLE_CLIENT_ID` (and secret) on the backend; the endpoint answers `503` until then | Button in `LoginPage`/`RegisterPage` is already present but disabled with that reason. Load GIS, hand the id token to `auth.loginWithGoogle`. |
| 2 | **Live tracking** for rides, deliveries, driver/agent push | Four WebSockets accept the token via `Authorization` header only; a browser cannot set WS headers. Needs `?token=` support mirroring `/api/ws`. | The sockets are already wired in `api/ws.ts`; `openBrowserIncompatibleSocket()` throws with the reason so nothing silently pretends to be live. Driver/agent boards poll `GET /api/driver/requests` and the tracking map swaps in. |
| 3 | **Subscriptions / paid plans** | No plan tables in the backend (Phase 7 decision: revenue = volumes only) | Subscription page, plan cards, paywall on listing limits, `usePlanAccess` hook. |
| 4 | **Ads** | No ads routes; the old ad surface queried Supabase tables that do not exist in the API | `HomeAdsStrip` plus per-placement rendering. Only after the backend owns ad records, otherwise a seller cannot buy one. |
| 5 | **Platform commission (15% ex-VAT)** | `revenue_kobo` is a documented constant 0; commission "would be its own phase" | Fee line in checkout/order summary, seller earnings breakdown, admin revenue analytics. |
| 6 | **Promo codes / cart persistence** | No promo or cart tables; the cart is deliberately client-side | Server-side cart, discount application at `POST /orders`, per-user coupon state. |
| 7 | **Saved shipping addresses** | Not modelled in the backend | Address book, address selection at checkout. |
| 8 | **Profile CV sections** (skills, experience, education, languages) | No such tables | Section editors + profile view. |
| 9 | **Self-service role upgrade** | Role changes are superadmin-only (`POST /api/admin/users/{pid}/role`) | Onboarding role picker that stops pretending: today the picker signals intent and the admin console grants it. |
| 10 | **Rental availability calendar** | Closed by decision (G3): dates are arranged by chat after booking | Calendar UI + conflict detection once availability is server-side. |
| 11 | **Job alerts** | No alert-subscription table | Email alert preferences, per-job alerts. |
| 12 | **AI assistant** | Needs a browser-reachable gateway that egresses from the user's IP (in progress on the router) | Chat widget. The existing ChatBot is local FAQ only; the Supabase edge-function call was deleted rather than left broken. |

## How a row closes

1. Backend ships the route and updates `khub-backend/docs/API.md`.
2. Add the entry to `src/api/coverage.ts` (status `client`) and the request
   shape to `src/api/registry.ts`.
3. `npm run coverage:md` — the manifest and the `/coverage` page update.
4. Build the screen; `node scripts/route-audit.mjs` must stop naming it.
