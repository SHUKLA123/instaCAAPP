import React from 'react';
import {FlatList, Text, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {SkeletonRow} from '@components/Skeleton';
import {EmptyState, ErrorState} from '@components/EmptyState';
import {Money} from '@components/Money';
import {useTheme} from '@theme/index';
import {casApi} from '@api/cas';
import {CaEarningEntry, Payout, PayoutStatus} from '@api/types';
import {formatDate} from '@utils/date';

const PAYOUT_STATUS_COLOR: Record<PayoutStatus, 'success' | 'warning' | 'danger' | 'textMuted'> = {
  paid: 'success',
  processing: 'warning',
  pending: 'textMuted',
  failed: 'danger',
};

export function CaEarningsScreen(): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const earningsQuery = useQuery({queryKey: ['ca-earnings'], queryFn: () => casApi.earnings({})});
  const payoutsQuery = useQuery({queryKey: ['ca-payouts'], queryFn: () => casApi.payouts({})});

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>Earnings</Text>

      {earningsQuery.isLoading && (
        <View>
          <SkeletonRow />
          <SkeletonRow />
        </View>
      )}
      {earningsQuery.isError && <ErrorState onRetry={() => earningsQuery.refetch()} />}

      <FlatList
        data={earningsQuery.data?.items ?? []}
        keyExtractor={item => item.id}
        ListEmptyComponent={!earningsQuery.isLoading ? <EmptyState icon="📊" title="No earnings yet" /> : null}
        renderItem={({item}) => <EarningRow entry={item} colors={colors} radius={radius} spacing={spacing} />}
        ListFooterComponent={
          <View style={{marginTop: spacing.lg}}>
            <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>Payout history</Text>
            {payoutsQuery.isLoading && <SkeletonRow />}
            {payoutsQuery.isError && <ErrorState onRetry={() => payoutsQuery.refetch()} />}
            {payoutsQuery.data?.items.length === 0 && (
              <EmptyState
                icon="🏦"
                title="No payouts yet"
                description="Payouts settle on your RazorpayX schedule once earnings clear — they'll list here as they land."
              />
            )}
            {payoutsQuery.data?.items.map(payout => (
              <PayoutRow key={payout.id} payout={payout} colors={colors} radius={radius} spacing={spacing} />
            ))}
          </View>
        }
      />
    </ScreenContainer>
  );
}

function EarningRow({
  entry,
  colors,
  radius,
  spacing,
}: {
  entry: CaEarningEntry;
  colors: ReturnType<typeof useTheme>['colors'];
  radius: ReturnType<typeof useTheme>['radius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}): React.JSX.Element {
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
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={{fontSize: 13, color: colors.textMuted}}>{entry.session_id ? 'Consultation' : 'Filing order'}</Text>
        <Money paise={entry.net_paise} size="md" colorOverride={colors.success} />
      </View>
      <Text style={{fontSize: 11, color: colors.textFaint, marginTop: 2}}>{formatDate(entry.created_at)}</Text>
      <View style={{flexDirection: 'row', gap: 12, marginTop: 6}}>
        <Text style={{fontSize: 11, color: colors.textMuted}}>Gross ₹{(entry.gross_paise / 100).toFixed(2)}</Text>
        <Text style={{fontSize: 11, color: colors.textMuted}}>Commission ₹{(entry.commission_paise / 100).toFixed(2)}</Text>
        <Text style={{fontSize: 11, color: colors.textMuted}}>TCS ₹{(entry.tcs_paise / 100).toFixed(2)}</Text>
      </View>
    </View>
  );
}

export function PayoutRow({payout, colors, radius, spacing}: {payout: Payout; colors: ReturnType<typeof useTheme>['colors']; radius: ReturnType<typeof useTheme>['radius']; spacing: ReturnType<typeof useTheme>['spacing']}): React.JSX.Element {
  const statusColor = colors[PAYOUT_STATUS_COLOR[payout.status]];
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
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Money paise={payout.net_paise} size="md" />
        <Text style={{fontSize: 12, fontWeight: '700', color: statusColor}}>{payout.status.toUpperCase()}</Text>
      </View>
      <Text style={{fontSize: 11, color: colors.textFaint, marginTop: 2}}>
        {formatDate(payout.created_at)} · TDS ₹{(payout.tds_paise / 100).toFixed(2)}
      </Text>
    </View>
  );
}
