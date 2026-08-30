import {useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {consultSocket} from '@ws/socket';
import {useConsultStore} from '@store/consult';
import {useWalletStore} from '@store/wallet';
import {useAuthStore} from '@store/auth';

/**
 * Mounted once near the root of the app. Wires the socket's server->client
 * events into the zustand stores + react-query cache. Screens read derived
 * state back out via useBillingMeter / useConsultStore / useWalletStore
 * rather than attaching their own top-level listeners for these events.
 */
export function useConsultSocket(): void {
  const queryClient = useQueryClient();
  const status = useAuthStore(s => s.status);

  useEffect(() => {
    if (status !== 'signed_in') return;
    consultSocket.connect();
    return () => consultSocket.disconnect();
  }, [status]);

  useEffect(() => {
    const unsubs = [
      consultSocket.on('consult.request', payload => {
        useConsultStore.getState().setIncomingRequest(payload);
      }),
      consultSocket.on('consult.accepted', payload => {
        queryClient.invalidateQueries({queryKey: ['consult-session', payload.session_id]});
      }),
      consultSocket.on('consult.rejected', () => {
        useConsultStore.getState().setIncomingRequest(null);
      }),
      consultSocket.on('consult.expired', () => {
        useConsultStore.getState().setIncomingRequest(null);
      }),
      consultSocket.on('consult.started', payload => {
        useConsultStore.getState().startMeter(payload.session_id, payload.max_minutes, payload.gross_rate_paise);
      }),
      consultSocket.on('consult.tick', payload => {
        useConsultStore.getState().applyTick({
          sessionId: payload.session_id,
          minutesBilled: payload.minutes_billed,
          amountBilledPaise: payload.amount_billed_paise,
          balancePaise: payload.balance_paise,
          minutesRemaining: payload.minutes_remaining,
          elapsedSeconds: payload.elapsed_seconds,
        });
        useWalletStore.getState().setBalance(payload.balance_paise);
      }),
      consultSocket.on('consult.low_balance', payload => {
        useConsultStore.getState().applyLowBalance(payload.session_id, payload.minutes_remaining);
      }),
      consultSocket.on('consult.ended', payload => {
        useConsultStore.getState().setEndedSummary(payload.session_id, payload.reason, payload.summary);
        queryClient.invalidateQueries({queryKey: ['wallet']});
        queryClient.invalidateQueries({queryKey: ['consult-history']});
      }),
      consultSocket.on('wallet.updated', payload => {
        useWalletStore.getState().setBalance(payload.balance_paise);
        queryClient.invalidateQueries({queryKey: ['wallet']});
      }),
      consultSocket.on('presence.update', () => {
        queryClient.invalidateQueries({queryKey: ['cas']});
      }),
      consultSocket.on('error', payload => {
        // eslint-disable-next-line no-console
        console.warn('[ws:error]', payload.code, payload.message);
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, [queryClient]);
}
