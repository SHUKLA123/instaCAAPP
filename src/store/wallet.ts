import {create} from 'zustand';
import {Paise} from '@api/types';

interface WalletUiState {
  balancePaise: Paise | null;
  setBalance: (paise: Paise) => void;
}

/** Live balance mirror, kept current by `wallet.updated` WS pushes so screens
 * don't need to poll — react-query still owns the transaction list/packs data. */
export const useWalletStore = create<WalletUiState>(set => ({
  balancePaise: null,
  setBalance: paise => set({balancePaise: paise}),
}));
