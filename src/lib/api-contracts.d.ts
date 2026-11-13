/** KHUB API contracts. Kept in sync with docs/FRONTEND_INTEGRATION_GUIDE.md. */
export type UUID = string;
export type NairaDecimalString = string;
export type Vertical = 'product' | 'service' | 'job' | 'rental';
export type CommissionModule = Vertical | 'ride' | 'delivery';

export interface ApiUser {
  pid: UUID;
  email: string;
  name: string;
  role: string;
  email_verified_at?: string | null;
  avatar_url?: string | null;
}

export interface AuthSession {
  user: ApiUser;
  token: string;
  refresh_token: string;
}

export interface Listing {
  pid: UUID;
  vertical: Vertical;
  title: string;
  description: string;
  category: string;
  location: string;
  price_kobo?: number | null;
  effective_price_kobo?: number | null;
  price_display?: string | null;
  status: string;
  attributes?: Record<string, unknown>;
  created_at: string;
}

export interface Order {
  pid: UUID;
  status: string;
  listing_pid: UUID;
  listing_title: string;
  listing_vertical: Vertical;
  buyer_pid: UUID;
  seller_pid: UUID;
  quantity: number;
  amount_kobo: number;
  amount_display: string;
  commission_rate_bps: number;
  commission_kobo: number;
  seller_net_kobo: number;
  created_at: string;
}

export interface WalletSummary {
  balance_kobo: number;
  balance_display: string;
}

export interface WalletEntry {
  id: number;
  entry_type: string;
  side: 'credit' | 'debit';
  amount_kobo: number;
  balance_after_kobo: number;
  narration?: string | null;
  created_at: string;
}

export interface FlutterwaveFundingIntent {
  pid: UUID;
  tx_ref: string;
  link: string;
  amount_kobo: number;
}

export interface RideEstimate {
  distance_m: number;
  fare_kobo: number;
  fare_display: string;
  base_fare_display: string;
  commission_kobo: number;
  commission_rate_bps: number;
  driver_net_kobo: number;
}

export interface DeliveryEstimate {
  distance_m: number;
  size_class: string;
  fee_kobo: number;
  fee_display: string;
  base_fee_display: string;
  commission_kobo: number;
  commission_rate_bps: number;
  agent_net_kobo: number;
}

export interface Notification {
  id: number;
  pid: UUID;
  kind: string;
  title: string;
  body?: string | null;
  ref_table?: string | null;
  ref_pid?: UUID | null;
  payload?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at: string;
}

export interface Conversation {
  pid: UUID;
  other_user_pid: UUID;
  other_user_name: string;
  ref_table?: string | null;
  ref_pid?: UUID | null;
  unread_count: number;
  last_message?: { body: string; sender_pid: UUID; created_at: string } | null;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  pid: UUID;
  sender_pid: UUID;
  body: string;
  attachment_key?: string | null;
  attachment_url?: string | null;
  created_at: string;
}

export interface CommissionRule {
  pid: UUID;
  module: CommissionModule;
  rate_bps: number;
  fixed_fee_kobo: number;
  min_fee_kobo?: number | null;
  max_fee_kobo?: number | null;
  enabled: boolean;
  updated_at: string;
}

export interface CommissionAccrual {
  pid: UUID;
  reference_type: 'orders' | 'rides' | 'deliveries';
  reference_pid: UUID;
  order_id?: number | null;
  order_pid?: UUID | null;
  module: CommissionModule;
  gross_kobo: number;
  commission_kobo: number;
  seller_net_kobo: number;
  rule_pid?: UUID | null;
  rate_bps: number;
  status: 'earned' | 'reversed';
  created_at: string;
}
