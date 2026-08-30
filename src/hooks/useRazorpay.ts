import {useCallback} from 'react';
import RazorpayCheckout, {RazorpayErrorResult, RazorpaySuccessResult} from 'react-native-razorpay';
import {RAZORPAY_KEY_ID} from '@config/env';
import {Paise, RazorpayOrderRef} from '@api/types';
import {useAuthStore} from '@store/auth';

interface OpenCheckoutArgs {
  order: RazorpayOrderRef;
  description: string;
  amountPaise: Paise;
}

interface RazorpayResult {
  success: boolean;
  payment?: RazorpaySuccessResult;
  cancelled?: boolean;
  errorMessage?: string;
}

/** Thin wrapper around react-native-razorpay's checkout sheet, normalizing the
 * success/cancel/error outcomes the rest of the app needs to react to. */
export function useRazorpay() {
  const user = useAuthStore(s => s.user);

  const open = useCallback(
    async ({order, description, amountPaise}: OpenCheckoutArgs): Promise<RazorpayResult> => {
      try {
        const payment = await RazorpayCheckout.open({
          key: order.key_id || RAZORPAY_KEY_ID,
          amount: amountPaise,
          currency: order.currency || 'INR',
          name: 'InstaCA',
          description,
          order_id: order.razorpay_order_id,
          prefill: {
            contact: user?.phone,
            name: user?.name,
            email: user?.email,
          },
          theme: {color: '#0B3B4E'},
        });
        return {success: true, payment};
      } catch (err) {
        const errorResult = err as Partial<RazorpayErrorResult> | undefined;
        if (errorResult?.code === 0 || /cancel/i.test(errorResult?.description ?? '')) {
          return {success: false, cancelled: true};
        }
        return {success: false, errorMessage: errorResult?.description ?? 'Payment failed'};
      }
    },
    [user],
  );

  return {open};
}
