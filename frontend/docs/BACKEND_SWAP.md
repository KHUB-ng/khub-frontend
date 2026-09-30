# Backend swap — Supabase tables → KHUB REST API

This app's data layer moved from Supabase to the Rust backend
(`KHUB-ng/khub-backend`, `docs/API.md` is the contract — 138 routes).

Typed client: `src/api/` (one module per route group). Auth: `src/contexts/AuthContext.tsx`
(same `useAuth()` contract as before — `user.id`, `signIn`, `signUp`, `signOut`, `updateProfile`).

## Rules that break things if ignored

1. **Money direction.** Sending an amount = **naira string** `"1500.05"` (use
   `toNairaString()` from `@/api`). Receiving = integer `*_kobo` plus ready
   `*_display`. Never send a JSON number, never compute totals client-side.
2. **Creation is payment.** `POST /api/orders`, `/api/rides`, `/api/deliveries`
   debit the wallet into escrow in the same transaction. No separate pay step.
   Short wallet → 400, nothing written.
3. **Two paginations.** Browse: `Page<T>` (`{items,page,total_pages,...}`).
   Feeds: keyset `?after=<id>&limit=`, newest first, no totals.
4. **Errors:** `{error, description}`. `503` = provider unconfigured.
5. **IDs** are UUID `pid`. Internal integer ids appear only in keyset cursors.
6. **Anti-enumeration:** register/forgot/reset/magic-link always answer 200.

## Table map

| Supabase table | Backend | Notes |
|---|---|---|
| `profiles` | `GET/PATCH /api/user/profile`, `GET /api/auth/current` | `id`←`pid`, `full_name`←`name`, `roles`←`[role]` |
| `wallets` | `GET /api/wallet` | `{pid, balance_kobo, balance_display}` |
| `transactions` | `GET /api/wallet/entries` | keyset ledger, newest first |
| `products` `services` `jobs` `rentals` | `/api/listings` (`vertical=`) | one unified listing surface; FTS search `GET /api/listings/search` |
| `orders` `order_items` | `POST/GET /api/orders`, `GET /api/orders/{pid}` | `{bought:[],sold:[]}`; deliver/confirm/cancel/dispute/review |
| `escrow_holds` | order/ride/delivery state itself | admin oversight: `GET /api/admin/escrows` |
| `job_applications` | `POST /api/listings/{pid}/applications`, `GET /api/my/applications`, `GET /api/listings/{pid}/applications/list`, `POST /api/applications/{pid}/status` | CV multipart |
| `saved_jobs` | `POST /api/wishlist/{pid}`, `GET /api/my/wishlist` | idempotent toggle |
| `rental_bookings` `rental_availability` | orders on rental listings; dates arranged by chat | no calendar in backend (decided) |
| `ride_requests` | `POST /api/rides`, `GET /api/rides/mine`, `GET /api/rides/{pid}` | |
| `ride_pricing` | `POST /api/rides/estimate` | server computes; client fares ignored |
| `driver_locations` | `GET /api/driver/requests?near_lat&near_lng&r_km` | REST board is authoritative; live WS push needs a backend change |
| `deliveries` `delivery_requests` | `/api/deliveries/*` + public tracker `/api/deliveries/public/{code}` | |
| `notifications` | `GET /api/notifications`, `/unread_count`, `POST /{pid}/read`, `/read_all` | keyset |
| `referrals` `referral_clicks` | `GET /api/referrals` | code issued lazily on first read |
| `email_otps` | `GET /api/auth/verify/{token}`, `POST /api/auth/resend-verification-mail` | |
| `documents` | `POST /api/user/kyc` (multipart `doc_type`+`document`), `GET /api/user/kyc` | 5 MB cap |
| `avatars` | `PATCH /api/user/profile` (`avatar_url`) | |
| `covers` | none | not modelled |
| `staff_users` | `GET /api/admin/users`, `POST /api/admin/users/{pid}/role` | superadmin-only |
| `carts` `applied_promos` `promo_codes` | none | cart stays client-side; promos are a backend gap |
| `shipping_addresses` `shipments` | none | backend gap |
| `user_subscriptions` `subscription_plans` | none | subscriptions are a new backend phase |
| `user_experiences` `user_skills` `user_languages` `user_education` | none | profile CV sections are a backend gap |
| `driver/agent profiles` | `/api/driver/*`, `/api/agent/*` | apply → KYC → admin approve → verify |

## Known gaps (backend work, not UI work)

Subscriptions, ads, platform commission, cart/promos, shipping, profile CV
sections, and four live-tracking WebSockets (browser cannot set the auth
header they require). Pages relying on them must show an honest "coming"
state, not fake data.
