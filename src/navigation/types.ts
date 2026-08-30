import {NavigatorScreenParams} from '@react-navigation/native';
import {ConsultMode, ServiceCategorySlug} from '@api/types';

export type ConsultStackParamList = {
  ConsultList: undefined;
  CaProfile: {caId: string};
  WaitingForCa: {sessionId: string; caId: string; caName: string; mode: ConsultMode};
  LiveConsult: {sessionId: string};
};

export type FilingsStackParamList = {
  CategoryGrid: undefined;
  ServiceList: {category: ServiceCategorySlug; categoryName: string};
  ServiceDetail: {slug: string};
  OrderSteps: {orderId: string};
  OrderPayment: {orderId: string};
  OrderTracking: {orderId: string};
};

export type ChatsStackParamList = {
  ChatsList: undefined;
  LiveConsult: {sessionId: string};
};

export type WalletStackParamList = {
  WalletHome: undefined;
  /** `suggestedAmountPaise` pre-fills the custom-amount field — used when a
   * consult/order was blocked by INSUFFICIENT_BALANCE so the recharge amount
   * is sized to the reported shortfall rather than the user guessing. */
  Recharge: {suggestedAmountPaise?: number} | undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  DocumentVault: undefined;
  Invoices: undefined;
  Kyc: undefined;
  Settings: undefined;
  CaRates: undefined;
  CaEarnings: undefined;
};

export type TabParamList = {
  ConsultTab: NavigatorScreenParams<ConsultStackParamList>;
  FilingsTab: NavigatorScreenParams<FilingsStackParamList>;
  ChatsTab: NavigatorScreenParams<ChatsStackParamList>;
  WalletTab: NavigatorScreenParams<WalletStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Phone: undefined;
  Otp: {requestId: string; phone: string};
  Main: NavigatorScreenParams<TabParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
