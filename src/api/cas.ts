import {apiClient, unwrap, unwrapPaged} from './client';
import {
  CaAvailabilityStatus,
  CaDashboard,
  CaEarningEntry,
  CaOnboardResult,
  CaProfileFull,
  CaProfileSummary,
  Payout,
  RateCard,
  Review,
} from './types';

export interface CaSearchParams {
  q?: string;
  specialization?: string;
  language?: string;
  status?: 'online';
  min_rate?: number;
  max_rate?: number;
  sort?: 'rating' | 'rate' | 'experience';
  page?: number;
  per_page?: number;
}

export const casApi = {
  search: (params: CaSearchParams) =>
    unwrapPaged<CaProfileSummary>(apiClient.get('/cas', {params})),

  getById: (id: string) => unwrap<CaProfileFull>(apiClient.get(`/cas/${id}`)),

  getReviews: (id: string, page = 1, perPage?: number) =>
    unwrapPaged<Review>(apiClient.get(`/cas/${id}/reviews`, {params: {page, per_page: perPage}})),

  /** Promotes the account to role=ca and re-issues tokens (the caller's
   * existing access token predates the new role). Callers MUST feed
   * `result.session` into the auth store right away — see
   * `useAuthStore.applyCaOnboarding`. */
  onboard: (payload: {membership_no: string; firm?: string; specializations?: string[]; languages?: string[]; experience_years?: number; bio?: string}) =>
    unwrap<CaOnboardResult>(apiClient.post('/ca/onboard', payload)),

  setRates: (payload: {chat_rate_paise: number; call_rate_paise: number}) =>
    unwrap<RateCard>(apiClient.put('/ca/rates', payload)),

  setAvailability: (status: CaAvailabilityStatus) =>
    unwrap<{status: CaAvailabilityStatus}>(apiClient.put('/ca/availability', {status})),

  dashboard: () => unwrap<CaDashboard>(apiClient.get('/ca/dashboard')),

  earnings: (params: {from?: string; to?: string; page?: number; per_page?: number}) =>
    unwrapPaged<CaEarningEntry>(apiClient.get('/ca/earnings', {params})),

  payouts: (params: {page?: number; per_page?: number}) =>
    unwrapPaged<Payout>(apiClient.get('/ca/payouts', {params})),
};
