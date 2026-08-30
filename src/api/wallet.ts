import {apiClient, unwrap, unwrapPaged} from './client';
import {RazorpayOrderRef, RechargePack, Wallet, WalletTransaction} from './types';

export const walletApi = {
  get: () => unwrap<Wallet>(apiClient.get('/wallet')),

  transactions: (page = 1, perPage?: number) =>
    unwrapPaged<WalletTransaction>(apiClient.get('/wallet/transactions', {params: {page, per_page: perPage}})),

  // Plain array in `data`, no `meta` — a small bounded list, not paginated.
  packs: () => unwrap<RechargePack[]>(apiClient.get('/wallet/packs')),

  recharge: (payload: {amount_paise: number; pack_id?: string}) =>
    unwrap<RazorpayOrderRef>(apiClient.post('/wallet/recharge', payload)),

  rechargeVerify: (payload: {razorpay_order_id: string; payment_id: string; signature: string}) =>
    unwrap<Wallet>(apiClient.post('/wallet/recharge/verify', payload)),
};
