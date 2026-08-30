import React, {useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Card} from '@components/Card';
import {Button} from '@components/Button';
import {Money} from '@components/Money';
import {ErrorState} from '@components/EmptyState';
import {useTheme} from '@theme/index';
import {ordersApi} from '@api/services';
import {ApiError} from '@api/client';
import {RequirementsMissingDetails} from '@api/types';
import {useRazorpay} from '@hooks/useRazorpay';
import {formatMoney} from '@utils/money';
import {FilingsStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<FilingsStackParamList, 'OrderPayment'>;

export function OrderPaymentScreen({route, navigation}: Props): React.JSX.Element {
  const {orderId} = route.params;
  const {colors, spacing} = useTheme();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const razorpay = useRazorpay();
  const queryClient = useQueryClient();

  const orderQuery = useQuery({queryKey: ['order', orderId], queryFn: () => ordersApi.getById(orderId)});

  if (orderQuery.isLoading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} style={{marginTop: spacing.xxl}} />
      </ScreenContainer>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => orderQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const order = orderQuery.data;
  const missingRequired = order.requirements.filter(r => r.required && !r.filled);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const razorpayOrder = await ordersApi.pay(orderId);
      const result = await razorpay.open({
        order: razorpayOrder,
        description: order.service_name,
        amountPaise: order.total_paise,
      });
      if (!result.success || !result.payment) {
        if (!result.cancelled) setError(result.errorMessage ?? 'Payment failed. Please try again.');
        return;
      }
      await ordersApi.payVerify(orderId, {
        razorpay_order_id: result.payment.razorpay_order_id,
        payment_id: result.payment.razorpay_payment_id,
        signature: result.payment.razorpay_signature,
      });
      queryClient.invalidateQueries({queryKey: ['orders']});
      navigation.replace('OrderTracking', {orderId});
    } catch (err) {
      // Branch on the error CODE, never on message text — see
      // docs/ARCHITECTURE.md §3. The server re-validates the checklist at
      // payment time, so a stale client (e.g. another tab edited the order)
      // can still get REQUIREMENTS_MISSING here even though our local
      // `missingRequired` check said everything was filled.
      if (err instanceof ApiError && err.code === 'REQUIREMENTS_MISSING') {
        const missing = (err.details as RequirementsMissingDetails | undefined)?.missing ?? [];
        setError(
          missing.length > 0
            ? `Still missing: ${missing.join(', ')}. Go back and fill these in before paying.`
            : 'Some required items are still missing. Go back and complete the checklist.',
        );
        queryClient.invalidateQueries({queryKey: ['order', orderId]});
      } else {
        setError(err instanceof ApiError ? err.message : 'Payment could not be verified. Please try again.');
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Text style={{fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.md}}>Review & pay</Text>

      <Card style={{marginBottom: spacing.md}}>
        <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>{order.service_name}</Text>
        <BreakdownRow label="Price" value={order.price_breakdown.price_paise} colors={colors} />
        {order.price_breakdown.cgst_paise > 0 && <BreakdownRow label="CGST" value={order.price_breakdown.cgst_paise} colors={colors} />}
        {order.price_breakdown.sgst_paise > 0 && <BreakdownRow label="SGST" value={order.price_breakdown.sgst_paise} colors={colors} />}
        {order.price_breakdown.igst_paise > 0 && <BreakdownRow label="IGST" value={order.price_breakdown.igst_paise} colors={colors} />}
        <View style={{borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs, paddingTop: spacing.xs, flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={{fontSize: 15, fontWeight: '700', color: colors.text}}>Total</Text>
          <Money paise={order.price_breakdown.total_paise} size="lg" />
        </View>
      </Card>

      {missingRequired.length > 0 && (
        <View style={{backgroundColor: colors.warningBg, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.md}}>
          <Text style={{color: colors.warning, fontSize: 12.5, fontWeight: '600'}}>
            {missingRequired.length} required item(s) still pending — go back and complete the checklist first.
          </Text>
        </View>
      )}

      {error && <Text style={{color: colors.danger, fontSize: 12.5, marginBottom: spacing.sm}}>{error}</Text>}

      <Button
        label={paying ? 'Processing…' : `Pay ${formatMoney(order.price_breakdown.total_paise)}`}
        onPress={handlePay}
        loading={paying}
        disabled={missingRequired.length > 0}
        fullWidth
        size="lg"
      />
    </ScreenContainer>
  );
}

function BreakdownRow({label, value, colors}: {label: string; value: number; colors: ReturnType<typeof useTheme>['colors']}): React.JSX.Element {
  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3}}>
      <Text style={{fontSize: 13, color: colors.textMuted}}>{label}</Text>
      <Money paise={value} size="sm" />
    </View>
  );
}
