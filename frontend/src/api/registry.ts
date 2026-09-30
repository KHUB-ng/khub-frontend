/**
 * Route registry — request metadata for every route in the backend.
 *
 * Drives the API Explorer: for each route it renders path-param inputs, query
 * inputs, a typed body form or multipart file picker, executes the call
 * through `client.request`, and shows the raw response. That is what makes
 * "every single backend route has UI" mechanically true rather than
 * aspirational — a route with no rich spec still gets a working generic form.
 *
 * Field types: "string" | "number" | "boolean" | "json" | "file" | "naira"
 * ("naira" = naira decimal string; "json" = parsed before send).
 */

export interface FieldSpec {
  name: string;
  type?: "string" | "number" | "boolean" | "json" | "file" | "naira";
  required?: boolean;
  example?: string;
  /** Accept attribute for file fields. */
  accept?: string;
  help?: string;
}

export interface RouteSpec {
  auth?: boolean;
  params?: FieldSpec[];
  query?: FieldSpec[];
  body?: FieldSpec[];
  /** Multipart field names; when present the request is sent as FormData. */
  files?: FieldSpec[];
  text?: FieldSpec[];
  example?: string;
}

const img = "image/jpeg,image/png,image/webp";
const doc = "application/pdf,.doc,.docx";

/** Key: `${METHOD} ${path}` exactly as listed in coverage.ts. */
export const SPECS: Record<string, RouteSpec> = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  "POST /api/auth/register": {
    auth: false,
    body: [
      { name: "email", type: "string", required: true, example: "you@example.com" },
      { name: "password", type: "string", required: true, example: "correct horse battery" },
      { name: "name", type: "string", required: true, example: "Adaeze Okafor" },
      { name: "referral_code", type: "string", help: "silently ignored if unknown" },
    ],
    example: "Always 200, even for a duplicate email (anti-enumeration).",
  },
  "GET /api/auth/verify/{token}": { auth: false, params: [{ name: "token", required: true }] },
  "POST /api/auth/login": {
    auth: false,
    body: [
      { name: "email", type: "string", required: true },
      { name: "password", type: "string", required: true },
    ],
    example: "401 covers bad creds AND unverified email with one message.",
  },
  "POST /api/auth/google": {
    auth: false,
    body: [{ name: "id_token", type: "string", required: true }],
    example: "503 if GOOGLE_CLIENT_ID is unset.",
  },
  "POST /api/auth/refresh": {
    auth: false,
    body: [{ name: "refresh_token", type: "string", required: true }],
    example: "Replaying a consumed token burns the whole session family.",
  },
  "POST /api/auth/logout": {
    body: [{ name: "refresh_token", type: "string", required: true }],
    example: "Idempotent.",
  },
  "GET /api/auth/sessions": {},
  "DELETE /api/auth/sessions/{session_id}": {
    params: [{ name: "session_id", required: true }],
  },
  "POST /api/auth/forgot": {
    auth: false,
    body: [{ name: "email", type: "string", required: true }],
    example: "Always 200.",
  },
  "POST /api/auth/reset": {
    auth: false,
    body: [
      { name: "token", type: "string", required: true },
      { name: "password", type: "string", required: true },
    ],
    example: "Always 200.",
  },
  "GET /api/auth/current": {},
  "POST /api/auth/magic-link": {
    auth: false,
    body: [{ name: "email", type: "string", required: true }],
  },
  "GET /api/auth/magic-link/{token}": {
    auth: false,
    params: [{ name: "token", required: true }],
  },
  "POST /api/auth/resend-verification-mail": {
    auth: false,
    body: [{ name: "email", type: "string", required: true }],
  },

  // ── User ─────────────────────────────────────────────────────────────────
  "GET /api/user/profile": {},
  "PATCH /api/user/profile": {
    body: [
      { name: "name", type: "string", help: "≥2 chars; empty string clears" },
      { name: "phone", type: "string", help: "≤20 chars" },
      { name: "address", type: "string" },
      { name: "location", type: "string" },
      { name: "avatar_url", type: "string" },
    ],
  },
  "GET /api/user/kyc": {},
  "POST /api/user/kyc": {
    files: [{ name: "document", type: "file", required: true, accept: img + ",application/pdf" }],
    text: [{ name: "doc_type", type: "string", required: true, example: "cac" }],
    example: "Re-submitting replaces the existing document.",
  },

  // ── Wallet ───────────────────────────────────────────────────────────────
  "GET /api/wallet": {},
  "GET /api/wallet/entries": {
    query: [
      { name: "after", type: "number", help: "keyset cursor, newest first" },
      { name: "limit", type: "number", example: "50" },
    ],
  },
  "POST /api/wallet/fund": {
    body: [{ name: "amount", type: "naira", required: true, example: "5000.00" }],
    example: "Returns hosted-checkout `link`. 503 if Flutterwave keys absent.",
  },
  "GET /api/wallet/fund/{pid}": {
    params: [{ name: "pid", required: true }],
    example: "Owner-only (403); re-verifies with Flutterwave on pending.",
  },
  "POST /api/wallet/withdraw": {
    body: [
      { name: "bank_code", type: "string", required: true, example: "044" },
      { name: "account_number", type: "string", required: true, example: "0123456789" },
      { name: "amount", type: "number", required: true, example: "5000", help: "whole naira only" },
    ],
    example: "Requires KYC verified; funds held until admin approves.",
  },
  "GET /api/wallet/withdrawals": {},
  "POST /api/wallet/transfer": {
    body: [
      { name: "email", type: "string", required: true },
      { name: "amount", type: "naira", required: true, example: "100.00" },
    ],
    example: "Recipient must exist AND be verified (else 404); no self-transfer.",
  },
  "GET /api/wallet/banks": {},

  // ── Listings ─────────────────────────────────────────────────────────────
  "POST /api/listings": {
    body: [
      { name: "vertical", type: "string", required: true, example: "product", help: "product | service | job | rental" },
      { name: "title", type: "string", required: true },
      { name: "description", type: "string", required: true },
      { name: "category", type: "string", required: true },
      { name: "location", type: "string" },
      { name: "price", type: "naira", help: "required except for job" },
      { name: "quantity", type: "number" },
      { name: "discount_percent", type: "number" },
      { name: "attributes", type: "json", help: "typed JSON per vertical" },
    ],
    example: "Role-gated per vertical: seller / service_provider / jobposter.",
  },
  "GET /api/listings": {
    auth: false,
    query: [
      { name: "vertical", type: "string" },
      { name: "category", type: "string" },
      { name: "location", type: "string" },
      { name: "min_price", type: "naira" },
      { name: "max_price", type: "naira" },
      { name: "sort", type: "string", example: "newest", help: "newest | price_asc | price_desc" },
      { name: "page", type: "number" },
      { name: "page_size", type: "number" },
    ],
  },
  "GET /api/listings/search": {
    auth: false,
    query: [
      { name: "q", type: "string", required: true },
      { name: "vertical", type: "string" },
      { name: "page", type: "number" },
      { name: "page_size", type: "number" },
    ],
  },
  "GET /api/listings/{pid}": { auth: false, params: [{ name: "pid", required: true }] },
  "PATCH /api/listings/{pid}": {
    params: [{ name: "pid", required: true }],
    body: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "price", type: "naira" },
      { name: "quantity", type: "number" },
      { name: "attributes", type: "json" },
    ],
  },
  "DELETE /api/listings/{pid}": { params: [{ name: "pid", required: true }] },
  "PATCH /api/listings/{pid}/status": {
    params: [{ name: "pid", required: true }],
    body: [{ name: "status", type: "string", required: true, example: "paused", help: "paused | active | archived" }],
  },
  "GET /api/my/listings": {},
  "POST /api/listings/{pid}/images": {
    params: [{ name: "pid", required: true }],
    files: [{ name: "image", type: "file", required: true, accept: img }],
    example: "jpg/png/webp, 5 MB, max 6 per listing.",
  },
  "DELETE /api/listings/{pid}/images/{image_pid}": {
    params: [
      { name: "pid", required: true },
      { name: "image_pid", required: true },
    ],
  },

  // ── Orders ───────────────────────────────────────────────────────────────
  "POST /api/orders": {
    body: [
      { name: "listing_pid", type: "string", required: true },
      { name: "quantity", type: "number", example: "1", help: "forced to 1 for non-products" },
    ],
    example: "CREATION IS PAYMENT — escrow debit in the same txn. Short wallet → 400.",
  },
  "GET /api/orders": {},
  "GET /api/orders/{pid}": { params: [{ name: "pid", required: true }] },
  "POST /api/orders/{pid}/deliver": { params: [{ name: "pid", required: true }], example: "seller only" },
  "POST /api/orders/{pid}/confirm": { params: [{ name: "pid", required: true }], example: "buyer only — releases escrow" },
  "POST /api/orders/{pid}/cancel": { params: [{ name: "pid", required: true }], example: "buyer, pre-delivery" },
  "POST /api/orders/{pid}/dispute": { params: [{ name: "pid", required: true }], example: "either party" },
  "POST /api/orders/{pid}/review": {
    params: [{ name: "pid", required: true }],
    body: [
      { name: "rating", type: "number", required: true, example: "5" },
      { name: "comment", type: "string" },
    ],
  },
  "GET /api/listings/{pid}/reviews": { auth: false, params: [{ name: "pid", required: true }] },
  "POST /api/wishlist/{pid}": { params: [{ name: "pid", required: true }], example: "idempotent toggle" },
  "GET /api/my/wishlist": {},

  // ── Rides ────────────────────────────────────────────────────────────────
  "POST /api/rides/estimate": {
    body: [
      { name: "pickup", type: "json", required: true, example: '{"lat":6.5244,"lng":3.3792,"label":"Yaba"}' },
      { name: "dest", type: "json", required: true, example: '{"lat":6.4667,"lng":3.6,"label":"Lekki"}' },
    ],
  },
  "POST /api/rides": {
    body: [
      { name: "pickup", type: "json", required: true, example: '{"lat":6.5244,"lng":3.3792}' },
      { name: "dest", type: "json", required: true, example: '{"lat":6.4667,"lng":3.6}' },
    ],
    example: "CREATION IS PAYMENT — fare debited + escrowed; client fare ignored.",
  },
  "GET /api/rides/mine": {},
  "GET /api/rides/{pid}": { params: [{ name: "pid", required: true }] },
  "GET /api/rides/{pid}/track": {
    params: [{ name: "pid", required: true }],
    example:
      "WEBSOCKET — header-only auth, so a browser CANNOT open it. Poll `GET /api/rides/{pid}` for status until the backend accepts ?token=.",
  },
  "POST /api/rides/{pid}/cancel": { params: [{ name: "pid", required: true }], example: "pre-start only" },
  "POST /api/rides/{pid}/dispute": { params: [{ name: "pid", required: true }] },
  "POST /api/rides/{pid}/rate": {
    params: [{ name: "pid", required: true }],
    body: [
      { name: "rating", type: "number", required: true, example: "5" },
      { name: "comment", type: "string" },
    ],
    example: "completed ride, once per party per trip",
  },

  // ── Driver ───────────────────────────────────────────────────────────────
  "POST /api/driver/apply": {
    body: [
      { name: "vehicle_type", type: "string", required: true, example: "toyota corolla" },
      { name: "vehicle_number", type: "string", required: true, example: "LAG-123-XY" },
      { name: "license_number", type: "string", required: true },
    ],
    example: "Role::Driver + KYC verified. Returns status pending.",
  },
  "GET /api/driver/me": {},
  "GET /api/driver/socket": {
    example:
      "WEBSOCKET — header-only auth, so a browser CANNOT open it (browsers cannot set WS headers). Drive the REST board `GET /api/driver/requests` instead until the backend accepts ?token=.",
  },
  "GET /api/driver/requests": {
    query: [
      { name: "near_lat", type: "number" },
      { name: "near_lng", type: "number" },
      { name: "r_km", type: "number" },
    ],
    example: "REST board is authoritative — poll this instead of the push socket.",
  },
  "GET /api/driver/rides": {},
  "GET /api/driver/earnings": {},
  "GET /api/driver/{pid}/rating": { auth: false, params: [{ name: "pid", required: true }] },
  "POST /api/driver/rides/{pid}/accept": { params: [{ name: "pid", required: true }], example: "first-wins; loser gets 400" },
  "POST /api/driver/rides/{pid}/arriving": { params: [{ name: "pid", required: true }] },
  "POST /api/driver/rides/{pid}/start": { params: [{ name: "pid", required: true }] },
  "POST /api/driver/rides/{pid}/complete": { params: [{ name: "pid", required: true }], example: "releases fare + fires referral in same txn" },

  // ── Deliveries ───────────────────────────────────────────────────────────
  "POST /api/deliveries/estimate": {
    body: [
      { name: "pickup", type: "json", required: true, example: '{"lat":6.5244,"lng":3.3792}' },
      { name: "dropoff", type: "json", required: true, example: '{"lat":6.4667,"lng":3.6}' },
      { name: "size_class", type: "string", required: true, example: "small", help: "small | medium | large" },
    ],
  },
  "POST /api/deliveries": {
    body: [
      { name: "pickup", type: "json", required: true, example: '{"lat":6.5244,"lng":3.3792}' },
      { name: "dropoff", type: "json", required: true, example: '{"lat":6.4667,"lng":3.6}' },
      { name: "size_class", type: "string", required: true, example: "medium" },
    ],
    example: "CREATION IS PAYMENT; returns a 10-char tracking_code.",
  },
  "GET /api/deliveries/mine": {},
  "GET /api/deliveries/{pid}": { params: [{ name: "pid", required: true }] },
  "GET /api/deliveries/{pid}/track": {
    params: [{ name: "pid", required: true }],
    example:
      "WEBSOCKET — header-only auth, so a browser CANNOT open it. Poll `GET /api/deliveries/{pid}` for status until the backend accepts ?token=.",
  },
  "POST /api/deliveries/{pid}/cancel": { params: [{ name: "pid", required: true }], example: "pre-pickup only" },
  "POST /api/deliveries/{pid}/dispute": { params: [{ name: "pid", required: true }] },
  "POST /api/deliveries/{pid}/rate": {
    params: [{ name: "pid", required: true }],
    body: [
      { name: "rating", type: "number", required: true, example: "5" },
      { name: "comment", type: "string" },
    ],
  },
  "GET /api/deliveries/public/{code}": {
    auth: false,
    params: [{ name: "code", required: true }],
    example: "Public tracker — status/timing only, no PII.",
  },

  // ── Delivery agent ───────────────────────────────────────────────────────
  "POST /api/agent/apply": {
    body: [
      { name: "vehicle_type", type: "string", required: true },
      { name: "vehicle_number", type: "string", required: true },
      { name: "license_number", type: "string", required: true },
    ],
  },
  "GET /api/agent/me": {},
  "GET /api/agent/socket": {
    example:
      "WEBSOCKET — header-only auth, so a browser CANNOT open it. Drive `GET /api/agent/requests` instead until the backend accepts ?token=.",
  },
  "GET /api/agent/requests": {
    query: [
      { name: "near_lat", type: "number" },
      { name: "near_lng", type: "number" },
      { name: "r_km", type: "number" },
    ],
  },
  "GET /api/agent/deliveries": {},
  "GET /api/agent/earnings": {},
  "GET /api/agent/{pid}/rating": { auth: false, params: [{ name: "pid", required: true }] },
  "POST /api/agent/deliveries/{pid}/accept": { params: [{ name: "pid", required: true }] },
  "POST /api/agent/deliveries/{pid}/pickup": { params: [{ name: "pid", required: true }] },
  "POST /api/agent/deliveries/{pid}/transit": { params: [{ name: "pid", required: true }] },
  "POST /api/agent/deliveries/{pid}/complete": { params: [{ name: "pid", required: true }] },

  // ── Job applications ─────────────────────────────────────────────────────
  "POST /api/listings/{pid}/applications": {
    params: [{ name: "pid", required: true }],
    files: [{ name: "cv", type: "file", accept: doc }],
    text: [{ name: "cover_note", type: "string" }],
    example: "Once per user per job (second → 400).",
  },
  "GET /api/listings/{pid}/applications/list": {
    params: [{ name: "pid", required: true }],
    example: "owner only — exposes applicant identity by design",
  },
  "GET /api/my/applications": {},
  "POST /api/applications/{pid}/status": {
    params: [{ name: "pid", required: true }],
    body: [{ name: "status", type: "string", required: true, example: "shortlisted" }],
    example: "applied→viewed/shortlisted/rejected · viewed→… · shortlisted→hired/rejected",
  },

  // ── Conversations ────────────────────────────────────────────────────────
  "POST /api/conversations": {
    body: [
      { name: "recipient_pid", type: "string", required: true },
      { name: "ref_table", type: "string" },
      { name: "ref_pid", type: "string" },
    ],
  },
  "GET /api/conversations": {},
  "GET /api/conversations/{pid}": { params: [{ name: "pid", required: true }] },
  "GET /api/conversations/{pid}/messages": {
    params: [{ name: "pid", required: true }],
    query: [
      { name: "after", type: "number" },
      { name: "limit", type: "number", example: "50" },
    ],
  },
  "POST /api/conversations/{pid}/messages": {
    params: [{ name: "pid", required: true }],
    body: [
      { name: "body", type: "string", required: true },
      { name: "attachment_key", type: "string" },
    ],
  },
  "POST /api/conversations/{pid}/read": { params: [{ name: "pid", required: true }] },
  "POST /api/conversations/{pid}/attachments": {
    params: [{ name: "pid", required: true }],
    files: [{ name: "file", type: "file", required: true, accept: img + ",application/pdf" }],
    example: "Returns attachment_key — reference it in the next message.",
  },

  // ── Chat WS ──────────────────────────────────────────────────────────────
  "GET /api/ws": {
    auth: false,
    example: "WebSocket — use the chat panel (query ?token=). Not an HTTP route.",
  },
  "GET /api/chat/ws": {
    auth: false,
    example: "Alias of /api/ws — same handler.",
  },

  // ── Notifications ────────────────────────────────────────────────────────
  "GET /api/notifications": {
    query: [
      { name: "limit", type: "number", example: "50" },
      { name: "after", type: "number" },
    ],
  },
  "GET /api/notifications/unread_count": {},
  "POST /api/notifications/{pid}/read": { params: [{ name: "pid", required: true }] },
  "POST /api/notifications/read_all": {},

  // ── Referrals ────────────────────────────────────────────────────────────
  "GET /api/referrals": { example: "Code issued lazily on this first read." },

  // ── Admin ────────────────────────────────────────────────────────────────
  "GET /api/admin/heartbeat": { example: "Role canary for the frontend." },
  "GET /api/admin/withdrawals": { query: [{ name: "status", type: "string", example: "requested" }] },
  "POST /api/admin/withdrawals/{pid}/approve": {
    params: [{ name: "pid", required: true }],
    example: "Calls Flutterwave transfer; 502 gateway; 503 unconfigured.",
  },
  "POST /api/admin/withdrawals/{pid}/reject": {
    params: [{ name: "pid", required: true }],
    body: [{ name: "note", type: "string" }],
  },
  "POST /api/admin/orders/{pid}/resolve": {
    params: [{ name: "pid", required: true }],
    body: [{ name: "for_seller", type: "boolean", required: true, example: "true" }],
  },
  "POST /api/admin/rides/{pid}/resolve": {
    params: [{ name: "pid", required: true }],
    body: [{ name: "for_driver", type: "boolean", required: true, example: "true" }],
  },
  "POST /api/admin/deliveries/{pid}/resolve": {
    params: [{ name: "pid", required: true }],
    body: [{ name: "for_agent", type: "boolean", required: true, example: "true" }],
  },
  "POST /api/admin/listings/{pid}/remove": {
    params: [{ name: "pid", required: true }],
    body: [{ name: "reason", type: "string", required: true }],
    example: "Takedown — owner cannot self-reactivate afterwards.",
  },
  "POST /api/admin/listings/{pid}/reactivate": { params: [{ name: "pid", required: true }] },
  "GET /api/admin/drivers": {},
  "POST /api/admin/drivers/{pid}/verify": { params: [{ name: "pid", required: true }], body: [{ name: "note", type: "string" }] },
  "POST /api/admin/drivers/{pid}/reject": { params: [{ name: "pid", required: true }], body: [{ name: "note", type: "string" }] },
  "POST /api/admin/drivers/{pid}/suspend": { params: [{ name: "pid", required: true }], body: [{ name: "note", type: "string" }] },
  "GET /api/admin/delivery-agents": {},
  "POST /api/admin/delivery-agents/{pid}/verify": { params: [{ name: "pid", required: true }], body: [{ name: "note", type: "string" }] },
  "POST /api/admin/delivery-agents/{pid}/reject": { params: [{ name: "pid", required: true }], body: [{ name: "note", type: "string" }] },
  "POST /api/admin/delivery-agents/{pid}/suspend": { params: [{ name: "pid", required: true }], body: [{ name: "note", type: "string" }] },
  "GET /api/admin/audit": {
    query: [
      { name: "after", type: "number" },
      { name: "actor_pid", type: "string" },
      { name: "limit", type: "number", example: "100" },
    ],
  },
  "GET /api/admin/kyc": { query: [{ name: "status", type: "string", example: "pending" }] },
  "POST /api/admin/kyc/{user_pid}/{doc_type}/approve": {
    params: [
      { name: "user_pid", required: true },
      { name: "doc_type", required: true, example: "cac" },
    ],
    body: [{ name: "note", type: "string" }],
  },
  "POST /api/admin/kyc/{user_pid}/{doc_type}/reject": {
    params: [
      { name: "user_pid", required: true },
      { name: "doc_type", required: true, example: "cac" },
    ],
    body: [{ name: "note", type: "string" }],
  },
  "GET /api/admin/users": {
    query: [
      { name: "query", type: "string" },
      { name: "role", type: "string", help: "buyer | seller | service_provider | jobposter | driver | logistics_agent | admin" },
      { name: "after", type: "number" },
    ],
  },
  "POST /api/admin/users/{pid}/role": {
    params: [{ name: "pid", required: true }],
    body: [{ name: "role", type: "string", required: true, example: "seller" }],
    example: "SUPERADMIN ONLY — superadmin's own account is locked.",
  },
  "POST /api/admin/users/{pid}/block": { params: [{ name: "pid", required: true }], example: "SUPERADMIN ONLY — revokes all sessions" },
  "POST /api/admin/users/{pid}/unblock": { params: [{ name: "pid", required: true }], example: "SUPERADMIN ONLY" },
  "GET /api/admin/escrows": {
    query: [
      { name: "status", type: "string" },
      { name: "after", type: "number" },
    ],
  },
  "GET /api/admin/wallets": { query: [{ name: "after", type: "number" }], example: "Each row carries a live `ledger_ok` integrity flag." },
  "GET /api/admin/users/{pid}/wallet": { params: [{ name: "pid", required: true }], example: "wallet + last 50 ledger entries" },
  "GET /api/admin/stats": { query: [{ name: "days", type: "number", example: "30" }] },
  "GET /api/admin/monitor": { example: "Live WS counts, queue depth, email budget, all limits." },

  // ── Framework / webhook ──────────────────────────────────────────────────
  "GET /_ping": { auth: false },
  "GET /_health": { auth: false },
  "GET /_readiness": { auth: false, example: "503 when DB, queue or cache fails." },
  "POST /webhooks/flutterwave": {
    auth: false,
    example: "SERVER-TO-SERVER — requires the verif-hash header. Not callable from a browser.",
  },
};

const GENERIC: RouteSpec = { auth: true, params: [], query: [], body: [] };

/** Spec for a route; always returns something so every route is invocable. */
export function specFor(method: string, path: string): RouteSpec {
  return SPECS[`${method} ${path}`] ?? GENERIC;
}

/** Fill `{pid}` placeholders so a spec can be previewed or tested. */
export function resolvePath(path: string, params: Record<string, string>): string {
  return path.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(params[key] ?? `{${key}}`));
}
