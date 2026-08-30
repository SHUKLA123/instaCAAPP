import {tokenStore} from '@api/client';
import {WS_BASE_URL} from '@config/env';
import {ClientEventMap, ClientEventType, ServerEventMap, ServerEventType, WsEnvelope} from './events';

/** Lightweight, dependency-free id generator — sortable enough for client_msg_id/envelope id use. */
export function generateId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${time}${rand}`;
}

type AnyListener = (payload: unknown, envelope: WsEnvelope) => void;

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

const HEARTBEAT_INTERVAL_MS = 20000;
const SERVER_TIMEOUT_MS = 90000;
const MAX_BACKOFF_MS = 30000;
const BASE_BACKOFF_MS = 1000;

/**
 * Typed WebSocket client for `/v1/ws`. Reconnects with exponential backoff,
 * sends a client heartbeat every 20s (matching the server's own ping cadence),
 * and force-closes+reconnects if nothing is heard from the server for 90s.
 */
class ConsultSocket {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'idle';
  private listeners = new Map<string, Set<AnyListener>>();
  private stateListeners = new Set<(s: ConnectionState) => void>();
  private reconnectAttempt = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
  private lastMessageAt = 0;

  connect(): void {
    const tokens = tokenStore.get();
    if (!tokens?.access) {
      return;
    }
    this.manuallyClosed = false;
    this.open(tokens.access);
  }

  private open(accessToken: string): void {
    this.setState(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    const url = `${WS_BASE_URL}/v1/ws?token=${encodeURIComponent(accessToken)}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.lastMessageAt = Date.now();
      this.setState('open');
      this.startHeartbeat();
      this.startWatchdog();
    };

    this.ws.onmessage = event => {
      this.lastMessageAt = Date.now();
      this.resetWatchdog();
      this.handleRawMessage(typeof event.data === 'string' ? event.data : '');
    };

    this.ws.onerror = () => {
      // onclose fires right after; reconnect logic lives there.
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.stopWatchdog();
      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      } else {
        this.setState('closed');
      }
    };
  }

  private handleRawMessage(raw: string): void {
    if (!raw) return;
    let envelope: WsEnvelope;
    try {
      envelope = JSON.parse(raw) as WsEnvelope;
    } catch {
      return;
    }
    const set = this.listeners.get(envelope.type);
    if (set) {
      set.forEach(listener => listener(envelope.payload, envelope));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {});
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private startWatchdog(): void {
    this.stopWatchdog();
    this.watchdogTimer = setTimeout(() => this.onWatchdogTimeout(), SERVER_TIMEOUT_MS);
  }

  private resetWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
    this.watchdogTimer = setTimeout(() => this.onWatchdogTimeout(), SERVER_TIMEOUT_MS);
  }

  private stopWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private onWatchdogTimeout(): void {
    // No message (incl. server pings) for 90s — treat the connection as dead.
    this.ws?.close();
  }

  private scheduleReconnect(): void {
    this.setState('reconnecting');
    const delay = Math.min(BASE_BACKOFF_MS * 2 ** this.reconnectAttempt, MAX_BACKOFF_MS);
    this.reconnectAttempt += 1;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => {
      const tokens = tokenStore.get();
      if (tokens?.access && !this.manuallyClosed) {
        this.open(tokens.access);
      }
    }, delay);
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.stopHeartbeat();
    this.stopWatchdog();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.setState('closed');
  }

  send<T extends ClientEventType>(type: T, payload: ClientEventMap[T]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    const envelope: WsEnvelope<ClientEventMap[T]> = {
      id: generateId(),
      type,
      ts: new Date().toISOString(),
      payload,
    };
    this.ws.send(JSON.stringify(envelope));
  }

  on<T extends ServerEventType>(type: T, listener: (payload: ServerEventMap[T], envelope: WsEnvelope) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type)!;
    const wrapped = listener as AnyListener;
    set.add(wrapped);
    return () => set.delete(wrapped);
  }

  onStateChange(listener: (s: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  getState(): ConnectionState {
    return this.state;
  }

  private setState(s: ConnectionState): void {
    this.state = s;
    this.stateListeners.forEach(l => l(s));
  }
}

export const consultSocket = new ConsultSocket();
