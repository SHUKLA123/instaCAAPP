import {useEffect, useRef, useState} from 'react';
import {useConsultStore} from '@store/consult';

export interface BillingMeterView {
  minutesBilled: number;
  amountBilledPaise: number;
  balancePaise: number;
  minutesRemaining: number;
  lowBalance: boolean;
  /** The server's real elapsed-seconds-for-this-session (consult.tick.elapsed_seconds),
   * plus a purely cosmetic local +1/sec ticker between server ticks so the header
   * doesn't look frozen — the cosmetic part is reset every time a new tick lands.
   * Money is NEVER derived from this; amounts always come straight off the tick. */
  elapsedSeconds: number;
}

/**
 * Reads the live billing meter for `sessionId` out of the consult store, which
 * is populated exclusively by `consult.tick` / `consult.low_balance` WS events
 * (see useConsultSocket).
 */
export function useBillingMeter(sessionId: string): BillingMeterView | null {
  const meter = useConsultStore(s => s.meter);
  const [localSeconds, setLocalSeconds] = useState(0);
  const lastServerElapsed = useRef<number>(-1);

  useEffect(() => {
    if (!meter || meter.sessionId !== sessionId) return;
    if (meter.elapsedSeconds !== lastServerElapsed.current) {
      lastServerElapsed.current = meter.elapsedSeconds;
      setLocalSeconds(0);
    }
  }, [meter, sessionId]);

  useEffect(() => {
    if (!meter || meter.sessionId !== sessionId) return;
    const id = setInterval(() => {
      setLocalSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [meter, sessionId]);

  if (!meter || meter.sessionId !== sessionId) return null;

  return {
    minutesBilled: meter.minutesBilled,
    amountBilledPaise: meter.amountBilledPaise,
    balancePaise: meter.balancePaise,
    minutesRemaining: meter.minutesRemaining,
    lowBalance: meter.lowBalance,
    elapsedSeconds: meter.elapsedSeconds + localSeconds,
  };
}
