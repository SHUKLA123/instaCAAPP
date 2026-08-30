import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Skeleton} from '@components/Skeleton';
import {ErrorState} from '@components/EmptyState';
import {useTheme} from '@theme/index';
import {servicesApi} from '@api/services';
import {FilingsStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<FilingsStackParamList, 'CategoryGrid'>;

const ICONS: Record<string, string> = {
  income_tax: '📋',
  gst: '🧾',
  roc_mca: '🏢',
  audit: '🔍',
  registration: '📝',
};

export function CategoryGridScreen({navigation}: Props): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const categoriesQuery = useQuery({queryKey: ['service-categories'], queryFn: servicesApi.categories});

  return (
    <ScreenContainer scroll edges={['top', 'left', 'right']}>
      <Text style={{fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.xxs}}>Filings</Text>
      <Text style={{fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg}}>
        Fixed-price compliance services, delivered by a verified CA.
      </Text>

      {categoriesQuery.isLoading && (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} width="47%" height={100} radius={radius.lg} />
          ))}
        </View>
      )}

      {categoriesQuery.isError && <ErrorState onRetry={() => categoriesQuery.refetch()} />}

      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
        {categoriesQuery.data?.map(cat => (
          <Pressable
            key={cat.slug}
            onPress={() => navigation.navigate('ServiceList', {category: cat.slug, categoryName: cat.name})}
            style={{
              width: '47%',
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.md,
              alignItems: 'flex-start',
            }}>
            <Text style={{fontSize: 28, marginBottom: spacing.xs}}>{ICONS[cat.slug] ?? '📄'}</Text>
            <Text style={{fontSize: 14.5, fontWeight: '700', color: colors.text}}>{cat.name}</Text>
            <Text style={{fontSize: 12, color: colors.textMuted, marginTop: 2}}>{cat.service_count} services</Text>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
