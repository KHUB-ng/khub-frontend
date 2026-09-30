/**
 * KHUB API types — transcribed from `khub-backend/docs/API.md`, the
 * code-verified contract (138 routes). Anything marked `unknown` there is
 * deliberately loose here rather than guessed.
 *
 * Two rules that shape every type below:
 *   - outbound money is a **naira string** (`"1500.05"`), never a number;
 *   - inbound money is an integer **kobo** field (`*_kobo`) plus a ready
 *     human string (`*_display`).
 */

/** Public identifiers are UUIDs — never the internal integer ids. */
export type Pid = string;

/** Loco's error envelope. Note: `src/dtos/common.rs::ApiError` is NOT this
 *  shape and no handler emits it — code against `{error, description}`. */
export interface ApiErrorBody {
  error: string;
  description: string;
}

/** Browse/search pagination envelope (has totals). */
export interface Page<T> {
  items: T[];
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
}

/** Keyset pagination for history/feeds: newest first, no totals. */
export interface KeysetQuery {
  after?: number;
  limit?: number;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export type Role =
  | "buyer"
  | "seller"
  | "service_provider"
  | "jobposter"
  | "driver"
  | "logistics_agent"
  | "admin"
  | "superadmin";

export interface User {
  pid: Pid;
  name?: string | null;
  email?: string;
  role?: Role;
  phone?: string | null;
  address?: string | null;
  location?: string | null;
  avatar_url?: string | null;
}

/** `POST /api/auth/login`, `/google`, `/refresh`, `GET /magic-link/{token}`. */
export interface LoginResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export interface Session {
  id: number | string;
  device?: string | null;
  ip?: string | null;
  created_at: string;
  expires_at: string;
}

// ── Wallet ──────────────────────────────────────────────────────────────────

export interface Wallet {
  pid: Pid;
  balance_kobo: number;
  balance_display: string;
}

export type LedgerSide = "credit" | "debit";

export interface LedgerEntry {
  id: number;
  entry_type: string;
  side: LedgerSide;
  amount_kobo: number;
  balance_after_kobo: number;
  narration?: string | null;
  created_at: string;
}

/** `POST /api/wallet/fund` — open `link` for Flutterwave hosted checkout. */
export interface FundIntent {
  pid: Pid;
  tx_ref: string;
  link: string;
  amount_kobo: number;
}

export interface WithdrawalResponse {
  pid?: Pid;
  status: string;
  [k: string]: unknown;
}

export interface Bank {
  code: string;
  name: string;
}

// ── Listings ────────────────────────────────────────────────────────────────

export type Vertical = "product" | "service" | "job" | "rental";

export interface ListingResponse {
  pid: Pid;
  vertical: Vertical;
  title: string;
  description?: string | null;
  category?: string | null;
  location?: string | null;
  price_kobo?: number | null;
  price_display?: string | null;
  quantity?: number | null;
  discount_percent?: number | null;
  status?: string;
  attributes?: Record<string, unknown> | null;
  [k: string]: unknown;
}

export interface ListingDetail {
  listing: ListingResponse;
  images: string[];
}

export interface Review {
  pid: Pid;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface WishlistItem {
  pid: Pid;
  title: string;
  vertical: Vertical;
  price_kobo: number | null;
}

// ── Orders ──────────────────────────────────────────────────────────────────

export interface OrderResponse {
  pid: Pid;
  status: string;
  listing_pid: Pid;
  listing_title: string;
  buyer_pid: Pid;
  seller_pid: Pid;
  quantity: number;
  amount_kobo: number;
  amount_display: string;
}

export interface OrderLists {
  bought: OrderResponse[];
  sold: OrderResponse[];
}

// ── Rides / deliveries ──────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface Estimate {
  distance_m: number;
  fare_kobo?: number;
  fare_display?: string;
  base_fare_display?: string;
  fee_kobo?: number;
  fee_display?: string;
  base_fee_display?: string;
  size_class?: string;
}

export type RideStatus =
  | "requested"
  | "accepted"
  | "arriving"
  | "started"
  | "completed"
  | "cancelled"
  | "disputed";

export interface RideResponse {
  pid: Pid;
  status: RideStatus | string;
  [k: string]: unknown;
}

export type DeliveryStatus =
  | "requested"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "disputed"
  | "refunded";

export interface DeliveryResponse {
  pid: Pid;
  status: DeliveryStatus | string;
  tracking_code?: string;
  [k: string]: unknown;
}

export interface PublicTracker {
  tracking_code: string;
  status: string;
  size_class: string;
  created_at: string;
  updated_at: string;
}

export type SizeClass = "small" | "medium" | "large";

export interface Earnings {
  source: "rides" | "deliveries";
  lifetime_kobo: number;
  lifetime_display: string;
  today_kobo: number;
  last_7_days_kobo: number;
  trips: number;
  recent: Array<{
    ref_pid: Pid;
    amount_kobo: number;
    amount_display: string;
    at: string;
  }>;
}

export interface RatingAggregate {
  count: number;
  avg: number;
}

export interface DriverResponse {
  pid?: Pid;
  status: string;
  [k: string]: unknown;
}

// ── Chat & notifications ────────────────────────────────────────────────────

export interface ConversationResponse {
  pid: Pid;
  other_user_pid: Pid;
  other_user_name: string;
  ref_table?: string | null;
  ref_pid?: Pid | null;
  last_message?: string | null;
  unread_count: number;
  created_at: string;
}

export interface MessageResponse {
  id: number;
  pid: Pid;
  sender_pid: Pid;
  body: string;
  attachment_key?: string | null;
  attachment_url?: string | null;
  created_at: string;
}

export interface AttachmentUpload {
  attachment_key: string;
  url: string;
}

export type NotificationKind =
  | "message"
  | "ride"
  | "order"
  | "kyc"
  | "withdrawal"
  | "system";

export interface NotificationResponse {
  id: number;
  pid: Pid;
  kind: NotificationKind;
  title: string;
  body: string;
  ref_table?: string | null;
  ref_pid?: Pid | null;
  payload?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at: string;
}

// ── Referrals ───────────────────────────────────────────────────────────────

export interface ReferralDashboard {
  code: string;
  reward_naira_display: string;
  stats: {
    total: number;
    rewarded: number;
    pending: number;
    rejected: number;
    earned_kobo: number;
    earned_display: string;
  };
  referrals: Array<{
    status: string;
    reward_kobo: number;
    rewarded_at?: string | null;
    created_at: string;
  }>;
}

// ── Job applications ────────────────────────────────────────────────────────

export type ApplicationStatus =
  | "applied"
  | "viewed"
  | "shortlisted"
  | "hired"
  | "rejected";

export interface Application {
  pid: Pid;
  status: ApplicationStatus | string;
  [k: string]: unknown;
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface KycDocument {
  doc_type: string;
  status: string;
  submitted_at?: string | null;
}

export interface KycStatus {
  status: string;
  documents: KycDocument[];
}

// ── Admin ───────────────────────────────────────────────────────────────────

export interface AdminAuditRow {
  id: number;
  action: string;
  actor_pid?: Pid | null;
  target?: unknown;
  before?: unknown;
  after?: unknown;
  created_at: string;
  [k: string]: unknown;
}

export interface WalletWithIntegrity extends Wallet {
  ledger_ok: boolean;
  [k: string]: unknown;
}

export interface MonitorSnapshot {
  ws?: Record<string, number>;
  queue_depth?: number;
  email?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  [k: string]: unknown;
}

export interface DailyStats {
  day: string;
  [metric: string]: unknown;
}
