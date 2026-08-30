import React, {useState} from 'react';
import {ActivityIndicator, Pressable, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Button} from '@components/Button';
import {Money} from '@components/Money';
import {ErrorState} from '@components/EmptyState';
import {useTheme} from '@theme/index';
import {walletApi} from '@api/wallet';
import {RechargePack} from '@api/types';
import {ApiError} from '@api/client';
import {useRazorpay} from '@hooks/useRazorpay';
import {paiseToRupees, rupeesToPaise} from '@utils/money';
import {WalletStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'Recharge'>;

export function RechargeScreen({navigation, route}: Props): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const suggestedAmountPaise = route.params?.suggestedAmountPaise;
  const [selectedPack, setSelectedPack] = useState<RechargePack | null>(null);
  const [customAmount, setCustomAmount] = useState(
    suggestedAmountPaise ? Math.ceil(paiseToRupees(suggestedAmountPaise)).toString() : '',
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const razorpay = useRazorpay();
  const queryClient = useQueryClient();

  const packsQuery = useQuery({queryKey: ['wallet-packs'], queryFn: walletApi.packs});

  const amountPaise = selectedPack ? selectedPack.amount_paise : rupeesToPaise(Number(customAmount) || 0);

  const handleRecharge = async () => {
    if (amountPaise <= 0) return;
    setProcessing(true);
    setError(null);
    try {
      const order = await walletApi.recharge({
        amount_paise: amountPaise,
        pack_id: selectedPack?.id,
      });
      const result = await razorpay.open({order, description: 'InstaCA wallet recharge', amountPaise});
      if (!result.success || !result.payment) {
        if (!result.cancelled) setError(result.errorMessage ?? 'Payment failed. Please try again.');
        return;
      }
      await walletApi.rechargeVerify({
        razorpay_order_id: result.payment.razorpay_order_id,
        payment_id: result.payment.razorpay_payment_id,
        signature: result.payment.razorpay_signature,
      });
      queryClient.invalidateQueries({queryKey: ['wallet']});
      queryClient.invalidateQueries({queryKey: ['wallet-transactions']});
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Recharge could not be completed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Text style={{fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs}}>Recharge wallet</Text>
      <Text style={{fontSize: 12.5, color: colors.textMuted, marginBottom: spacing.md}}>
        {suggestedAmountPaise ? "We've pre-filled enough to cover what you were short on." : ' '}
      </Text>

      {packsQuery.isLoading && <ActivityIndicator color={colors.primary} />}
      {packsQuery.isError && <ErrorState onRetry={() => packsQuery.refetch()} />}

      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md}}>
        {packsQuery.data?.map(pack => {
          const selected = selectedPack?.id === pack.id;
          return (
            <Pressable
              key={pack.id}
              onPress={() => {
                setSelectedPack(pack);
                setCustomAmount('');
              }}
              style={{
                width: '47%',
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.bgSubtle : colors.card,
                borderRadius: radius.lg,
                padding: spacing.md,
              }}>
              <Money paise={pack.amount_paise} size="lg" />
              {pack.bonus_paise > 0 && (
                <Text style={{fontSize: 11.5, color: colors.success, fontWeight: '700', marginTop: 4}}>
                  +{`₹${(pack.bonus_paise / 100).toFixed(0)}`} bonus
                </Text>
              )}
              {pack.label && <Text style={{fontSize: 11, color: colors.textMuted, marginTop: 4}}>{pack.label}</Text>}
            </Pressable>
          );
        })}
      </View>

      <Text style={{fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs}}>Or enter a custom amount</Text>
      <TextInput
        value={customAmount}
        onChangeText={text => {
          setCustomAmount(text.replace(/[^\d]/g, ''));
          setSelectedPack(null);
        }}
        keyboardType="number-pad"
        placeholder="₹ Amount"
        placeholderTextColor={colors.textFaint}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: 16,
          color: colors.text,
          backgroundColor: colors.bgElevated,
          marginBottom: spacing.lg,
        }}
      />

      {error && <Text style={{color: colors.danger, fontSize: 12.5, marginBottom: spacing.sm}}>{error}</Text>}

      <Button
        label={amountPaise > 0 ? `Pay & recharge` : 'Select or enter an amount'}
        onPress={handleRecharge}
        loading={processing}
        disabled={amountPaise <= 0}
        fullWidth
        size="lg"
      />
    </ScreenContainer>
  );
}
