import React, {useState} from 'react';
import {FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {SkeletonRow} from '@components/Skeleton';
import {EmptyState, ErrorState} from '@components/EmptyState';
import {Money} from '@components/Money';
import {useTheme} from '@theme/index';
import {servicesApi} from '@api/services';
import {FilingsStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<FilingsStackParamList, 'ServiceList'>;

export function ServiceListScreen({route, navigation}: Props): React.JSX.Element {
  const {category, categoryName} = route.params;
  const {colors, spacing, radius} = useTheme();
  const [q, setQ] = useState('');

  const servicesQuery = useQuery({
    queryKey: ['services', category, q],
    queryFn: () => servicesApi.list({category, q: q || undefined}),
  });

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Text style={{fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>{categoryName}</Text>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search services"
        placeholderTextColor={colors.textFaint}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          color: colors.text,
          backgroundColor: colors.bgElevated,
          marginBottom: spacing.sm,
        }}
      />

      {servicesQuery.isLoading && (
        <View>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      )}
      {servicesQuery.isError && <ErrorState onRetry={() => servicesQuery.refetch()} />}

      <FlatList
        data={servicesQuery.data ?? []}
        keyExtractor={item => item.id}
        ListEmptyComponent={!servicesQuery.isLoading ? <EmptyState icon="🗂️" title="No services found" /> : null}
        renderItem={({item}) => (
          <Pressable
            onPress={() => navigation.navigate('ServiceDetail', {slug: item.slug})}
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.sm,
            }}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm}}>
                {item.name}
              </Text>
              <Money paise={item.price_paise} size="md" />
            </View>
            <Text style={{fontSize: 12.5, color: colors.textMuted, marginTop: 4}} numberOfLines={2}>
              {item.short_description}
            </Text>
            <Text style={{fontSize: 11.5, color: colors.textFaint, marginTop: 6}}>
              SLA: {item.sla_days} day{item.sla_days !== 1 ? 's' : ''} · incl. {item.gst_rate_percent}% GST
            </Text>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
