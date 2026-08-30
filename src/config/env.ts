import {Platform} from 'react-native';
import Config from 'react-native-config';

/**
 * Runtime configuration, in one place.
 *
 * Values come from `.env` via react-native-config. That library needs a native
 * build step on iOS, and if it hasn't been wired up yet `Config.*` is simply
 * undefined — so every value here has a fallback that points at a backend
 * running on your own machine. The practical effect: a fresh clone builds and
 * talks to `make run` on localhost without any configuration at all.
 *
 * Android emulators cannot see the host's `localhost` — that address is the
 * emulator itself — so they use the special alias 10.0.2.2. iOS simulators
 * share the host network and use localhost directly.
 */

const LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const LOCAL_PORT = 8080;

const devApiBase = `http://${LOCAL_HOST}:${LOCAL_PORT}`;
const devWsBase = `ws://${LOCAL_HOST}:${LOCAL_PORT}`;

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** The deployed backend on Render. Used by any build that has no .env. */
const DEPLOYED_API = 'https://instaca-api.onrender.com';
const DEPLOYED_WS = 'wss://instaca-api.onrender.com';

/** Base URL of the Go API, without a trailing slash. */
export const API_BASE_URL = trimSlash(
  Config.API_BASE_URL || (__DEV__ ? devApiBase : DEPLOYED_API),
);

/** WebSocket origin for /v1/ws, without a trailing slash. */
export const WS_BASE_URL = trimSlash(
  Config.WS_BASE_URL || (__DEV__ ? devWsBase : DEPLOYED_WS),
);

/**
 * Agora App ID for voice calls. The App *Certificate* never ships in the app —
 * per-session tokens are minted by the backend at
 * GET /v1/consult/sessions/{id}/call-token.
 */
export const AGORA_APP_ID = Config.AGORA_APP_ID ?? '';

/** Razorpay key id. Public by design; the key secret stays server-side. */
export const RAZORPAY_KEY_ID = Config.RAZORPAY_KEY_ID ?? '';

/**
 * Fallback GST rate, used only to render a price hint before the API has
 * answered. The server is always the authority on what a client is charged.
 */
export const DEFAULT_GST_RATE_PERCENT = Number(
  Config.DEFAULT_GST_RATE_PERCENT ?? 18,
);

/** True when the app is talking to a backend on the developer's own machine. */
export const IS_LOCAL_BACKEND =
  API_BASE_URL.includes('localhost') || API_BASE_URL.includes('10.0.2.2');

if (__DEV__) {
  // Printed once at startup: the single most common reason a fresh build shows
  // an empty screen is that it is pointed at the wrong host.
  console.log(`[InstaCA] API ${API_BASE_URL}  WS ${WS_BASE_URL}`);
}
