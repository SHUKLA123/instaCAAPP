import {create} from 'zustand';
import {CaAvailabilityStatus} from '@api/types';

interface CaUiState {
  /** Local-optimistic mirror of the CA's own availability, reconciled with `presence.update`. */
  status: CaAvailabilityStatus;
  setStatus: (status: CaAvailabilityStatus) => void;
}

export const useCaStore = create<CaUiState>(set => ({
  status: 'offline',
  setStatus: status => set({status}),
}));
