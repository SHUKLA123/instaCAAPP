import React from 'react';
import {FlatList, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Card} from '@components/Card';
import {Button} from '@components/Button';
import {Money} from '@components/Money';
import {SkeletonRow} from '@components/Skeleton';
import {EmptyState, ErrorState} from '@components/EmptyState';
import {useTheme} from '@theme/index';
import {walletApi} from '@api/wallet';
import {WalletTransaction} from '@api/types';
import {useWalletStore} from '@store/wallet';
import {formatDateTime} from '@utils/date';
import {WalletStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'WalletHome'>;

export function WalletScreen({navigation}: Props): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const liveBalance = useWalletStore(s => s.balancePaise);

  const walletQuery = useQuery({queryKey: ['wallet'], queryFn: walletApi.get});
  const txQuery = useQuery({queryKey: ['wallet-transactions'], queryFn: () => walletApi.transactions(1)});

  const balance = liveBalance ?? walletQuery.data?.balance_paise ?? 0;

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <Text style={{fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md}}>Wallet</Text>

      <Card style={{backgroundColor: colors.primary, marginBottom: spacing.md, borderColor: colors.primary}}>
        <Text style={{color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600'}}>AVAILABLE BALANCE</Text>
        <Money paise={balance} size="xl" colorOverride={colors.onPrimary} style={{marginTop: 4}} />
        <Button label="Recharge wallet" variant="secondary" onPress={() => navigation.navigate('Recharge')} style={{marginTop: spacing.md}} fullWidth />
      </Card>

      <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>Recent transactions</Text>

      {txQuery.isLoading && (
        <View>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      )}
      {txQuery.isError && <ErrorState onRetry={() => txQuery.refetch()} />}

      <FlatList
        data={txQuery.data?.items ?? []}
        keyExtractor={item => item.id}
        ListEmptyComponent={!txQuery.isLoading ? <EmptyState icon="🧾" title="No transactions yet" /> : null}
        renderItem={({item}) => <TransactionRow tx={item} colors={colors} radius={radius} spacing={spacing} />}
      />
    </ScreenContainer>
  );
}

function TransactionRow({
  tx,
  colors,
  radius,
  spacing,
}: {
  tx: WalletTransaction;
  colors: ReturnType<typeof useTheme>['colors'];
  radius: ReturnType<typeof useTheme>['radius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}): React.JSX.Element {
  const isCredit = tx.direction === 'credit';
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.sm,
        marginBottom: spacing.xs,
      }}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <Text style={{flex: 1, fontSize: 13.5, color: colors.text, fontWeight: '600', marginRight: spacing.sm}}>
          {tx.description}
        </Text>
        <Money paise={isCredit ? tx.amount_paise : -tx.amount_paise} size="sm" colorOverride={isCredit ? colors.success : colors.text} signed />
      </View>
      <Text style={{fontSize: 11, color: colors.textFaint, marginTop: 2}}>{formatDateTime(tx.created_at)}</Text>
      {tx.tax_split && tx.tax_split.total_tax_paise > 0 && (
        <Text style={{fontSize: 11, color: colors.textMuted, marginTop: 4}}>
          Base ₹{(tx.tax_split.base_paise / 100).toFixed(2)} + GST ₹{(tx.tax_split.total_tax_paise / 100).toFixed(2)}
        </Text>
      )}
    </View>
  );
}
