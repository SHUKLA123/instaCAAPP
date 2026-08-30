/**
 * Mirrors docs/ARCHITECTURE.md section 3 (REST API) and the data model in section 2.
 * Keep field names identical to the contract — do not rename.
 */

export type Paise = number;
export type IsoDateString = string;
export type Ulid = string;

export type UserRole = 'client' | 'ca' | 'admin';
export type KycState = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: UserRole;
  state_code?: string;
  kyc_state: KycState;
  pan_masked?: string;
  created_at: IsoDateString;
}

export interface Wallet {
  balance_paise: Paise;
  locked_paise: Paise;
  version: number;
}

export interface CaProfileSummary {
  id: string;
  name: string;
  avatar_url?: string;
  specializations: string[];
  languages: string[];
  experience_years: number;
  rating: number;
  rating_count: number;
  status: CaAvailabilityStatus;
  chat_rate_gross_paise: Paise;
  call_rate_gross_paise: Paise;
}

export interface CaProfileFull extends CaProfileSummary {
  firm?: string;
  membership_no_masked?: string;
  bio?: string;
  verified: boolean;
  chat_rate_base_paise: Paise;
  call_rate_base_paise: Paise;
  gst_rate_percent: number;
}

/** Response of `PUT /v1/ca/rates` — base rates the CA set plus the computed
 * gross the client will actually be billed. `gst_bps` is basis points
 * (1 bps = 0.01%), so percent = gst_bps / 100. */
export interface RateCard {
  chat_base_paise: Paise;
  chat_gross_paise: Paise;
  call_base_paise: Paise;
  call_gross_paise: Paise;
  gst_bps: number;
}

/** Response of `POST /v1/ca/onboard`. Onboarding promotes the account to
 * role=ca, which the caller's existing access token predates — the server
 * re-issues a fresh token pair (and the up-to-date `user` with the new role)
 * that MUST be written into the auth store immediately, or every CA-only
 * route 403s until the user signs out and back in. */
export interface CaOnboardResult {
  profile: CaProfileFull;
  session: {
    access: string;
    refresh: string;
    expires_in: number;
    user: User;
  };
}

export type CaAvailabilityStatus = 'online' | 'busy' | 'offline';

export interface Review {
  id: string;
  session_id: string;
  client_name: string;
  rating: number;
  comment?: string;
  created_at: IsoDateString;
}

export interface Paged<T> {
  items: T[];
  page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  has_more: boolean;
}

/** Raw shape the server actually sends for a paginated list: rows in `data`,
 * counters in a sibling `meta`. See docs/ARCHITECTURE.md §3. `unwrapPaged` in
 * client.ts turns this into the `Paged<T>` shape above that screens consume. */
export interface PagedMeta {
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

// ---- Auth ----

export interface OtpRequestResponse {
  request_id: string;
  expires_in: number;
}

export interface OtpVerifyResponse {
  access: string;
  refresh: string;
  user: User;
  is_new: boolean;
}

export interface RefreshResponse {
  access: string;
  refresh: string;
}

export interface MeResponse {
  user: User;
  wallet: Wallet;
  ca_profile?: CaProfileFull;
}

// ---- Wallet ----

export interface RechargePack {
  id: string;
  amount_paise: Paise;
  bonus_paise: Paise;
  label?: string;
}

export type WalletTxDirection = 'credit' | 'debit';

export interface TaxSplit {
  base_paise: Paise;
  cgst_paise: Paise;
  sgst_paise: Paise;
  igst_paise: Paise;
  total_tax_paise: Paise;
}

export interface WalletTransaction {
  id: string;
  direction: WalletTxDirection;
  amount_paise: Paise;
  balance_after_paise: Paise;
  tax_split?: TaxSplit;
  description: string;
  created_at: IsoDateString;
  idempotency_key: string;
}

export interface RazorpayOrderRef {
  razorpay_order_id: string;
  amount_paise: Paise;
  currency: string;
  key_id: string;
}

// ---- Consultation ----

export type ConsultMode = 'chat' | 'call';

export type ConsultState =
  | 'requested'
  | 'active'
  | 'rejected'
  | 'expired'
  | 'ended_user'
  | 'ended_insufficient'
  | 'ended_disconnect'
  | 'settled';

export interface ConsultIntake {
  query_text?: string;
  category?: ServiceCategorySlug | string;
  document_ids?: string[];
}

export interface QuoteResponse {
  ca_id: string;
  mode: ConsultMode;
  base_rate_paise: Paise;
  gross_rate_paise: Paise;
  gst_rate_percent: number;
  min_minutes: number;
  max_minutes: number;
  wallet_balance_paise: Paise;
}

export interface ConsultRequestResponse {
  session_id: string;
  state: ConsultState;
  expires_at: IsoDateString;
}

export interface ConsultTaxBreakup {
  base_paise: Paise;
  cgst_paise: Paise;
  sgst_paise: Paise;
  igst_paise: Paise;
}

export interface ConsultSession {
  id: string;
  ca_id: string;
  ca_name: string;
  ca_avatar_url?: string;
  client_id: string;
  client_name: string;
  mode: ConsultMode;
  state: ConsultState;
  gross_rate_paise: Paise;
  gst_rate_percent: number;
  minutes_billed: number;
  amount_billed_paise: Paise;
  max_minutes: number;
  minutes_remaining: number;
  started_at?: IsoDateString;
  ended_at?: IsoDateString;
  intake?: ConsultIntake;
  created_at: IsoDateString;
}

export type MessageDeliveryState = 'sent' | 'delivered' | 'read';

export interface ConsultMessage {
  id: string;
  session_id: string;
  client_msg_id: string;
  sender_id: string;
  body?: string;
  document_id?: string;
  state: MessageDeliveryState;
  created_at: IsoDateString;
}

export interface CallTokenResponse {
  agora_app_id: string;
  channel: string;
  uid: number;
  token: string;
  expires_at: IsoDateString;
}

// ---- Documents ----

export type DocumentShareScope = 'session' | 'order';

export interface DocumentUploadUrlResponse {
  document_id: string;
  upload_url: string;
  headers: Record<string, string>;
}

export interface VaultDocument {
  id: string;
  original_name: string;
  mime: string;
  size_bytes: number;
  folder?: string;
  is_encrypted: boolean;
  created_at: IsoDateString;
}

// ---- Filings / services ----

export type ServiceCategorySlug =
  | 'income_tax'
  | 'gst'
  | 'roc_mca'
  | 'audit'
  | 'registration';

export interface ServiceCategory {
  slug: ServiceCategorySlug;
  name: string;
  icon: string;
  service_count: number;
}

export interface ServiceListItem {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategorySlug;
  short_description: string;
  price_paise: Paise;
  gst_rate_percent: number;
  sla_days: number;
}

export type RequirementKind = 'document' | 'text' | 'date' | 'select';

export interface ServiceRequirement {
  key: string;
  label: string;
  kind: RequirementKind;
  required: boolean;
  help_text?: string;
  options?: string[];
}

export interface ServiceDetail extends ServiceListItem {
  long_description: string;
  requirements: ServiceRequirement[];
}

export interface OrderAnswer {
  key: string;
  text_value?: string;
  document_id?: string;
}

export type OrderState =
  | 'draft'
  | 'awaiting_payment'
  | 'paid'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_client'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface OrderPriceBreakdown {
  price_paise: Paise;
  cgst_paise: Paise;
  sgst_paise: Paise;
  igst_paise: Paise;
  total_paise: Paise;
}

export interface OrderRequirementAnswer extends OrderAnswer {
  label: string;
  kind: RequirementKind;
  required: boolean;
  filled: boolean;
  help_text?: string;
  options?: string[];
}

export interface ServiceOrderEvent {
  id: string;
  state: OrderState;
  note?: string;
  created_at: IsoDateString;
}

export interface Deliverable {
  id: string;
  document_id: string;
  label: string;
  created_at: IsoDateString;
}

export interface ServiceOrderSummary {
  id: string;
  service_name: string;
  service_slug: string;
  category: ServiceCategorySlug;
  state: OrderState;
  total_paise: Paise;
  sla_days: number;
  created_at: IsoDateString;
}

export interface ServiceOrder extends ServiceOrderSummary {
  price_breakdown: OrderPriceBreakdown;
  requirements: OrderRequirementAnswer[];
  timeline: ServiceOrderEvent[];
  deliverables: Deliverable[];
  assigned_ca_name?: string;
}

// ---- Invoices ----

export interface Invoice {
  id: string;
  reference: string;
  total_paise: Paise;
  place_of_supply: string;
  created_at: IsoDateString;
}

// ---- CA-side ----

export interface CaDashboard {
  today_earnings_paise: Paise;
  today_sessions: number;
  rating: number;
  rating_count: number;
  status: CaAvailabilityStatus;
}

export interface CaEarningEntry {
  id: string;
  session_id?: string;
  order_id?: string;
  gross_paise: Paise;
  commission_paise: Paise;
  tcs_paise: Paise;
  net_paise: Paise;
  created_at: IsoDateString;
}

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface Payout {
  id: string;
  amount_paise: Paise;
  tds_paise: Paise;
  net_paise: Paise;
  status: PayoutStatus;
  razorpayx_ref?: string;
  created_at: IsoDateString;
}

// ---- Envelope ----

export interface ApiSuccess<T> {
  data: T;
}

/**
 * Known error codes from docs/ARCHITECTURE.md §3. Screens must branch on
 * `code`, never on `message` text (message is human-readable and may change
 * wording without notice). This union isn't exhaustive of every code the
 * server can return — unmodeled codes still flow through as a plain string.
 */
export type ApiErrorCode =
  | 'INSUFFICIENT_BALANCE'
  | 'CA_NOT_AVAILABLE'
  | 'CA_NOT_VERIFIED'
  | 'REQUIREMENTS_MISSING'
  | 'INVALID_SESSION_STATE'
  | 'TOKEN_EXPIRED'
  | (string & {});

export interface InsufficientBalanceDetails {
  balance_paise: Paise;
  required_paise: Paise;
  shortfall_paise: Paise;
  min_minutes: number;
}

export interface RequirementsMissingDetails {
  missing: string[];
}

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
}
