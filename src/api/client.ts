import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig} from 'axios';
import {API_BASE_URL} from '@config/env';
import {ApiErrorBody, ApiErrorCode, ApiErrorEnvelope, ApiSuccess, Paged, PagedMeta, RefreshResponse} from './types';

/** Screens must branch on `.code` (an ApiErrorCode), never on `.message` —
 * message text is for display only and may be reworded without notice. */
export class ApiError extends Error {
  code: ApiErrorCode;
  details?: Record<string, unknown>;
  status?: number;

  constructor(body: ApiErrorBody, status?: number) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.details = body.details;
    this.status = status;
  }
}

interface TokenPair {
  access: string;
  refresh: string;
}

type TokenListener = (tokens: TokenPair | null) => void;

/**
 * Holds the current access/refresh pair in memory and persists it via the
 * injected storage adapter. The zustand auth store wires itself up via
 * `subscribe` so both stay in sync without a circular import.
 */
class TokenStore {
  private tokens: TokenPair | null = null;
  private listeners = new Set<TokenListener>();

  get(): TokenPair | null {
    return this.tokens;
  }

  set(tokens: TokenPair | null): void {
    this.tokens = tokens;
    this.listeners.forEach(l => l(tokens));
  }

  subscribe(listener: TokenListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const tokenStore = new TokenStore();

// Resolved in src/config/env.ts, which falls back to a locally running
// backend in dev so a fresh clone works with no configuration.

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  timeout: 20000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = tokenStore.get();
  if (tokens?.access) {
    config.headers.set('Authorization', `Bearer ${tokens.access}`);
  }
  return config;
});

let refreshPromise: Promise<TokenPair> | null = null;

async function performRefresh(): Promise<TokenPair> {
  const current = tokenStore.get();
  if (!current?.refresh) {
    throw new Error('No refresh token available');
  }
  const res = await axios.post<ApiSuccess<RefreshResponse>>(
    `${API_BASE_URL}/v1/auth/refresh`,
    {refresh: current.refresh},
  );
  const next: TokenPair = {access: res.data.data.access, refresh: res.data.data.refresh};
  tokenStore.set(next);
  return next;
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiErrorEnvelope>) => {
    const original = error.config as (AxiosRequestConfig & {_retry?: boolean}) | undefined;
    const bodyCode = error.response?.data && 'error' in error.response.data ? error.response.data.error.code : undefined;
    // Only worth retrying via refresh when the server actually says the
    // access token expired (or didn't say anything, e.g. a bare 401 from an
    // edge proxy) — a 401 with a different code (bad credentials, revoked
    // session, ...) would just fail again after refreshing.
    const shouldAttemptRefresh = error.response?.status === 401 && (bodyCode === undefined || bodyCode === 'TOKEN_EXPIRED');

    if (shouldAttemptRefresh && original && !original._retry) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? performRefresh();
        const tokens = await refreshPromise;
        refreshPromise = null;
        original.headers = {...original.headers, Authorization: `Bearer ${tokens.access}`};
        return apiClient.request(original);
      } catch (refreshErr) {
        refreshPromise = null;
        tokenStore.set(null);
        return Promise.reject(refreshErr);
      }
    }

    if (error.response?.data && 'error' in error.response.data) {
      return Promise.reject(new ApiError(error.response.data.error, error.response.status));
    }
    return Promise.reject(error);
  },
);

/** Unwraps the `{ data }` success envelope. Errors already surface as ApiError. */
export async function unwrap<T>(promise: Promise<{data: ApiSuccess<T>}>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

/**
 * Unwraps a paginated list response. The server puts the rows directly in
 * `data` (a plain array, no wrapper) and the counters in a sibling `meta` —
 * see docs/ARCHITECTURE.md §3. This maps that wire shape onto the `Paged<T>`
 * shape screens already consume (`items`, `page`, `total_pages`, ...).
 */
export async function unwrapPaged<T>(promise: Promise<{data: {data: T[]; meta: PagedMeta}}>): Promise<Paged<T>> {
  const res = await promise;
  const {data: items, meta} = res.data;
  return {
    items,
    page: meta.page,
    per_page: meta.per_page,
    total_count: meta.total,
    total_pages: meta.per_page > 0 ? Math.ceil(meta.total / meta.per_page) : 0,
    has_more: meta.has_more,
  };
}

/** For endpoints that reply 204 No Content — there is no body to parse, so
 * this just awaits the request and discards whatever axios hands back. */
export async function unwrapVoid(promise: Promise<unknown>): Promise<void> {
  await promise;
}
