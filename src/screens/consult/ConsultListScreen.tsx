import React, {useMemo, useState} from 'react';
import {FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {CaCard} from '@components/CaCard';
import {SkeletonCaCard} from '@components/Skeleton';
import {EmptyState, ErrorState} from '@components/EmptyState';
import {Chip} from '@components/Chip';
import {useTheme} from '@theme/index';
import {casApi, CaSearchParams} from '@api/cas';
import {ConsultStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<ConsultStackParamList, 'ConsultList'>;

const SPECIALIZATIONS = ['Income Tax', 'GST', 'ROC/MCA', 'Audit', 'Startup Advisory'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi'];
const SORTS: {key: NonNullable<CaSearchParams['sort']>; label: string}[] = [
  {key: 'rating', label: 'Top rated'},
  {key: 'rate', label: 'Lowest rate'},
  {key: 'experience', label: 'Most experienced'},
];

export function ConsultListScreen({navigation}: Props): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const [query, setQuery] = useState('');
  const [specialization, setSpecialization] = useState<string | undefined>();
  const [language, setLanguage] = useState<string | undefined>();
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sort, setSort] = useState<CaSearchParams['sort']>('rating');

  const params: CaSearchParams = useMemo(
    () => ({
      q: query || undefined,
      specialization,
      language,
      status: onlineOnly ? 'online' : undefined,
      sort,
      page: 1,
    }),
    [query, specialization, language, onlineOnly, sort],
  );

  const casQuery = useQuery({
    queryKey: ['cas', params],
    queryFn: () => casApi.search(params),
  });

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <Text style={{fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>
        Find a Chartered Accountant
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or expertise"
        placeholderTextColor={colors.textFaint}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: 14,
          color: colors.text,
          backgroundColor: colors.bgElevated,
          marginBottom: spacing.sm,
        }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingBottom: spacing.xs}}>
        <Chip label="Online now" selected={onlineOnly} onPress={() => setOnlineOnly(v => !v)} icon="🟢" />
        {SPECIALIZATIONS.map(spec => (
          <Chip
            key={spec}
            label={spec}
            selected={specialization === spec}
            onPress={() => setSpecialization(s => (s === spec ? undefined : spec))}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingVertical: spacing.xs}}>
        {LANGUAGES.map(lang => (
          <Chip key={lang} label={lang} selected={language === lang} onPress={() => setLanguage(l => (l === lang ? undefined : lang))} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingBottom: spacing.sm}}>
        {SORTS.map(s => (
          <Chip key={s.key} label={s.label} selected={sort === s.key} onPress={() => setSort(s.key)} />
        ))}
      </ScrollView>

      {casQuery.isLoading && (
        <View style={{marginTop: spacing.xs}}>
          <SkeletonCaCard />
          <SkeletonCaCard />
          <SkeletonCaCard />
        </View>
      )}

      {casQuery.isError && <ErrorState onRetry={() => casQuery.refetch()} />}

      {casQuery.data && (
        <FlatList
          data={casQuery.data.items}
          keyExtractor={item => item.id}
          renderItem={({item}) => <CaCard ca={item} onPress={() => navigation.navigate('CaProfile', {caId: item.id})} />}
          refreshControl={<RefreshControl refreshing={casQuery.isFetching} onRefresh={() => casQuery.refetch()} />}
          ListEmptyComponent={
            <EmptyState icon="🔍" title="No CAs match your filters" description="Try widening your search or clearing a filter." />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
