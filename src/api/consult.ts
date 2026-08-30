import {apiClient, unwrap, unwrapPaged, unwrapVoid} from './client';
import {
  CallTokenResponse,
  ConsultIntake,
  ConsultMessage,
  ConsultMode,
  ConsultRequestResponse,
  ConsultSession,
  ConsultState,
  Paged,
  QuoteResponse,
  Review,
} from './types';

export const consultApi = {
  quote: (payload: {ca_id: string; mode: ConsultMode}) =>
    unwrap<QuoteResponse>(apiClient.post('/consult/quote', payload)),

  createRequest: (payload: {ca_id: string; mode: ConsultMode; intake?: ConsultIntake}) =>
    unwrap<ConsultRequestResponse>(apiClient.post('/consult/requests', payload)),

  getSession: (id: string) => unwrap<ConsultSession>(apiClient.get(`/consult/sessions/${id}`)),

  accept: (id: string) => unwrap<ConsultSession>(apiClient.post(`/consult/sessions/${id}/accept`)),

  // 204 No Content — nothing to parse.
  reject: (id: string, reason?: string): Promise<void> =>
    unwrapVoid(apiClient.post(`/consult/sessions/${id}/reject`, {reason})),

  end: (id: string, reason?: string) =>
    unwrap<ConsultSession>(apiClient.post(`/consult/sessions/${id}/end`, {reason})),

  // Plain array in `data` — a session's messages are a small bounded list,
  // not paginated (before/limit is a cursor, not a page).
  messages: (id: string, params: {before?: string; limit?: number}) =>
    unwrap<ConsultMessage[]>(apiClient.get(`/consult/sessions/${id}/messages`, {params})),

  history: (params: {role: 'client' | 'ca'; state?: ConsultState; page?: number; per_page?: number}): Promise<Paged<ConsultSession>> =>
    unwrapPaged<ConsultSession>(apiClient.get('/consult/sessions', {params})),

  // 201 Created — returns the created Review, not a bare acknowledgement.
  review: (id: string, payload: {rating: number; comment?: string}) =>
    unwrap<Review>(apiClient.post(`/consult/sessions/${id}/review`, payload)),

  callToken: (id: string) => unwrap<CallTokenResponse>(apiClient.get(`/consult/sessions/${id}/call-token`)),
};
