import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {authApi} from '@api/auth';
import {tokenStore} from '@api/client';
import {CaOnboardResult, CaProfileFull, RateCard, User, Wallet} from '@api/types';
import {consultSocket} from '@ws/socket';

const STORAGE_KEY = 'instaca.auth.v1';

interface StoredAuth {
  access: string;
  refresh: string;
}

interface AuthState {
  status: 'unknown' | 'signed_out' | 'signed_in';
  user: User | null;
  wallet: Wallet | null;
  caProfile: CaProfileFull | null;
  hydrate: () => Promise<void>;
  signIn: (tokens: StoredAuth, user: User) => Promise<void>;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
  setWallet: (wallet: Wallet) => void;
  setCaProfile: (profile: CaProfileFull) => void;
  /** POST /ca/onboard promotes the account to role=ca and re-issues tokens
   * (the caller's existing access token predates the new role) — this MUST
   * be called with the response right away, or every CA-only route 403s
   * until the user signs out and back in. */
  applyCaOnboarding: (result: CaOnboardResult) => Promise<void>;
  /** PUT /ca/rates returns a RateCard, not a full CaProfileFull — this merges
   * its base/gross rates into the existing caProfile in place. */
  applyRateCard: (rates: RateCard) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  user: null,
  wallet: null,
  caProfile: null,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({status: 'signed_out'});
        return;
      }
      const stored = JSON.parse(raw) as StoredAuth;
      tokenStore.set(stored);
      const me = await authApi.me();
      set({status: 'signed_in', user: me.user, wallet: me.wallet, caProfile: me.ca_profile ?? null});
      consultSocket.connect();
    } catch {
      tokenStore.set(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({status: 'signed_out'});
    }
  },

  signIn: async (tokens, user) => {
    tokenStore.set(tokens);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    set({status: 'signed_in', user});
    try {
      const me = await authApi.me();
      set({wallet: me.wallet, caProfile: me.ca_profile ?? null, user: me.user});
    } catch {
      // /me will be retried by react-query elsewhere; sign-in itself already succeeded.
    }
    consultSocket.connect();
  },

  refreshMe: async () => {
    const me = await authApi.me();
    set({user: me.user, wallet: me.wallet, caProfile: me.ca_profile ?? null});
  },

  signOut: async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort
    }
    consultSocket.disconnect();
    tokenStore.set(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({status: 'signed_out', user: null, wallet: null, caProfile: null});
  },

  setWallet: wallet => set({wallet}),
  setCaProfile: profile => set({caProfile: profile}),

  applyCaOnboarding: async result => {
    const tokens: StoredAuth = {access: result.session.access, refresh: result.session.refresh};
    tokenStore.set(tokens);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    set({status: 'signed_in', user: result.session.user, caProfile: result.profile});
  },

  applyRateCard: rates => {
    const current = get().caProfile;
    if (!current) return;
    set({
      caProfile: {
        ...current,
        chat_rate_base_paise: rates.chat_base_paise,
        chat_rate_gross_paise: rates.chat_gross_paise,
        call_rate_base_paise: rates.call_base_paise,
        call_rate_gross_paise: rates.call_gross_paise,
        gst_rate_percent: rates.gst_bps / 100,
      },
    });
  },
}));

export function getCurrentUser(): User | null {
  return useAuthStore.getState().user;
}
