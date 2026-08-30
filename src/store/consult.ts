import {create} from 'zustand';
import {Paise} from '@api/types';
import {ConsultEndedSummary, ConsultRequestPayload} from '@ws/events';

export interface BillingMeterState {
  sessionId: string;
  minutesBilled: number;
  amountBilledPaise: Paise;
  balancePaise: Paise;
  minutesRemaining: number;
  /** Real elapsed seconds from the server clock (consult.tick.elapsed_seconds). */
  elapsedSeconds: number;
  lowBalance: boolean;
}

interface ConsultState {
  /** Populated on the CA side when a `consult.request` WS event arrives; drives the incoming-request full-screen card. */
  incomingRequest: ConsultRequestPayload | null;
  /** Live billing meter for whichever session is currently on screen, updated only from `consult.tick`/`consult.low_balance`. */
  meter: BillingMeterState | null;
  /** Final summary shown on the post-call rating sheet, from `consult.ended`. */
  endedSummary: {sessionId: string; summary: ConsultEndedSummary; reason: string} | null;

  setIncomingRequest: (req: ConsultRequestPayload | null) => void;
  startMeter: (sessionId: string, maxMinutes: number, grossRatePaise: Paise) => void;
  applyTick: (payload: {
    sessionId: string;
    minutesBilled: number;
    amountBilledPaise: Paise;
    balancePaise: Paise;
    minutesRemaining: number;
    elapsedSeconds: number;
  }) => void;
  applyLowBalance: (sessionId: string, minutesRemaining: number) => void;
  setEndedSummary: (sessionId: string, reason: string, summary: ConsultEndedSummary) => void;
  clearSession: () => void;
}

export const useConsultStore = create<ConsultState>((set, get) => ({
  incomingRequest: null,
  meter: null,
  endedSummary: null,

  setIncomingRequest: req => set({incomingRequest: req}),

  startMeter: (sessionId, maxMinutes, _grossRatePaise) =>
    set({
      meter: {
        sessionId,
        minutesBilled: 0,
        amountBilledPaise: 0,
        balancePaise: 0,
        minutesRemaining: maxMinutes,
        elapsedSeconds: 0,
        lowBalance: false,
      },
    }),

  applyTick: ({sessionId, minutesBilled, amountBilledPaise, balancePaise, minutesRemaining, elapsedSeconds}) => {
    const current = get().meter;
    if (!current || current.sessionId !== sessionId) return;
    set({
      meter: {
        ...current,
        minutesBilled,
        amountBilledPaise,
        balancePaise,
        minutesRemaining,
        elapsedSeconds,
      },
    });
  },

  applyLowBalance: (sessionId, minutesRemaining) => {
    const current = get().meter;
    if (!current || current.sessionId !== sessionId) return;
    set({meter: {...current, minutesRemaining, lowBalance: true}});
  },

  setEndedSummary: (sessionId, reason, summary) => set({endedSummary: {sessionId, reason, summary}}),

  clearSession: () => set({meter: null, incomingRequest: null}),
}));
