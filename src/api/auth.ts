import {apiClient, unwrap, unwrapVoid} from './client';
import {MeResponse, OtpRequestResponse, OtpVerifyResponse, RefreshResponse, User} from './types';

export const authApi = {
  requestOtp: (phone: string) =>
    unwrap<OtpRequestResponse>(apiClient.post('/auth/otp/request', {phone})),

  verifyOtp: (request_id: string, code: string) =>
    unwrap<OtpVerifyResponse>(apiClient.post('/auth/otp/verify', {request_id, code})),

  refresh: (refresh: string) => unwrap<RefreshResponse>(apiClient.post('/auth/refresh', {refresh})),

  // 204 No Content
  logout: (): Promise<void> => unwrapVoid(apiClient.post('/auth/logout')),

  me: () => unwrap<MeResponse>(apiClient.get('/me')),

  updateMe: (patch: Partial<Pick<User, 'name' | 'email' | 'state_code'>>) =>
    unwrap<User>(apiClient.patch('/me', patch)),
};
