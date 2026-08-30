import React from 'react';
import {FlatList, Linking, Pressable, Text, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {SkeletonRow} from '@components/Skeleton';
import {EmptyState, ErrorState} from '@components/EmptyState';
import {Money} from '@components/Money';
import {useTheme} from '@theme/index';
import {invoicesApi} from '@api/invoices';
import {formatDate} from '@utils/date';

export function InvoicesScreen(): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const invoicesQuery = useQuery({queryKey: ['invoices'], queryFn: () => invoicesApi.list(1)});

  const openPdf = async (id: string) => {
    try {
      const {url} = await invoicesApi.getPdfUrl(id);
      await Linking.openURL(url);
    } catch {
      // best-effort
    }
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      {invoicesQuery.isLoading && (
        <View>
          <SkeletonRow />
          <SkeletonRow />
        </View>
      )}
      {invoicesQuery.isError && <ErrorState onRetry={() => invoicesQuery.refetch()} />}

      <FlatList
        data={invoicesQuery.data?.items ?? []}
        keyExtractor={item => item.id}
        ListEmptyComponent={!invoicesQuery.isLoading ? <EmptyState icon="🧾" title="No invoices yet" /> : null}
        renderItem={({item}) => (
          <Pressable
            onPress={() => openPdf(item.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.sm,
              marginBottom: spacing.xs,
            }}>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 13.5, fontWeight: '700', color: colors.text}}>{item.reference}</Text>
              <Text style={{fontSize: 11.5, color: colors.textMuted, marginTop: 2}}>
                {formatDate(item.created_at)} · {item.place_of_supply}
              </Text>
            </View>
            <Money paise={item.total_paise} size="sm" />
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
