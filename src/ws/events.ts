/**
 * Mirrors docs/ARCHITECTURE.md section 4 (WebSocket protocol) exactly.
 * `type` strings and payload shapes must match the server contract verbatim.
 */
import {CaAvailabilityStatus, ConsultIntake, ConsultMessage, ConsultMode, IsoDateString, Paise, Ulid} from '@api/types';

export interface WsEnvelope<T = unknown> {
  id: Ulid;
  type: string;
  ts: IsoDateString;
  payload: T;
}

// ---- Client -> server payloads ----

export interface PingPayload {}

export interface PresenceSetPayload {
  status: CaAvailabilityStatus;
}

export interface ConsultAcceptPayload {
  session_id: string;
}

export interface ConsultRejectPayload {
  session_id: string;
  reason?: string;
}

export interface ConsultEndPayload {
  session_id: string;
  reason?: string;
}

export interface ChatSendPayload {
  session_id: string;
  client_msg_id: string;
  body?: string;
  document_id?: string;
}

export interface ChatTypingPayload {
  session_id: string;
  is_typing: boolean;
}

export interface ChatReadPayload {
  session_id: string;
  up_to_message_id: string;
}

export type ClientEventMap = {
  ping: PingPayload;
  'presence.set': PresenceSetPayload;
  'consult.accept': ConsultAcceptPayload;
  'consult.reject': ConsultRejectPayload;
  'consult.end': ConsultEndPayload;
  'chat.send': ChatSendPayload;
  'chat.typing': ChatTypingPayload;
  'chat.read': ChatReadPayload;
};

// ---- Server -> client payloads ----

export interface PongPayload {}

export interface ConsultRequestPayload {
  session_id: string;
  ca_id: string;
  client_id: string;
  client_name: string;
  client_avatar_url?: string;
  mode: ConsultMode;
  gross_rate_paise: Paise;
  intake?: ConsultIntake;
  expires_at: IsoDateString;
}

export interface ConsultAcceptedPayload {
  session_id: string;
}

export interface ConsultRejectedPayload {
  session_id: string;
  reason?: string;
}

export interface ConsultExpiredPayload {
  session_id: string;
}

export interface ConsultStartedPayload {
  session_id: string;
  started_at: IsoDateString;
  gross_rate_paise: Paise;
  max_minutes: number;
}

export interface ConsultTickPayload {
  session_id: string;
  minutes_billed: number;
  amount_billed_paise: Paise;
  balance_paise: Paise;
  minutes_remaining: number;
  /** Real elapsed seconds for the session, from the server clock — the
   * billing header ticks off this, not a client-side timer. */
  elapsed_seconds: number;
}

export interface ConsultLowBalancePayload {
  session_id: string;
  minutes_remaining: number;
}

export interface ConsultEndedSummary {
  minutes: number;
  total_paise: Paise;
  tax_breakup: {
    base_paise: Paise;
    cgst_paise: Paise;
    sgst_paise: Paise;
    igst_paise: Paise;
  };
}

export interface ConsultEndedPayload {
  session_id: string;
  reason: string;
  summary: ConsultEndedSummary;
}

export interface PresenceUpdatePayload {
  ca_id: string;
  status: CaAvailabilityStatus;
}

export interface WalletUpdatedPayload {
  balance_paise: Paise;
}

export interface WsErrorPayload {
  code: string;
  message: string;
  ref_id?: string;
}

export type ServerEventMap = {
  pong: PongPayload;
  'consult.request': ConsultRequestPayload;
  'consult.accepted': ConsultAcceptedPayload;
  'consult.rejected': ConsultRejectedPayload;
  'consult.expired': ConsultExpiredPayload;
  'consult.started': ConsultStartedPayload;
  'consult.tick': ConsultTickPayload;
  'consult.low_balance': ConsultLowBalancePayload;
  'consult.ended': ConsultEndedPayload;
  'chat.message': ConsultMessage;
  'chat.typing': ChatTypingPayload;
  'chat.read': ChatReadPayload;
  'presence.update': PresenceUpdatePayload;
  'wallet.updated': WalletUpdatedPayload;
  error: WsErrorPayload;
};

export type ServerEventType = keyof ServerEventMap;
export type ClientEventType = keyof ClientEventMap;
