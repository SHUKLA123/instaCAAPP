import React, {useMemo} from 'react';
import {FlatList, Pressable, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Avatar} from '@components/Avatar';
import {SkeletonRow} from '@components/Skeleton';
import {EmptyState, ErrorState} from '@components/EmptyState';
import {Money} from '@components/Money';
import {useTheme} from '@theme/index';
import {consultApi} from '@api/consult';
import {ConsultSession, ConsultState} from '@api/types';
import {formatDateTime} from '@utils/date';
import {ChatsStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatsList'>;

const ACTIVE_STATES: ConsultState[] = ['requested', 'active'];

const STATE_LABELS: Record<ConsultState, string> = {
  requested: 'Waiting',
  active: 'Live now',
  rejected: 'Declined',
  expired: 'Expired',
  ended_user: 'Completed',
  ended_insufficient: 'Ended · balance',
  ended_disconnect: 'Ended · disconnected',
  settled: 'Completed',
};

export function ChatsListScreen({navigation}: Props): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();

  const historyQuery = useQuery({
    queryKey: ['consult-history', 'client'],
    queryFn: () => consultApi.history({role: 'client'}),
    refetchInterval: 20000,
  });

  const {active, past} = useMemo(() => {
    const items = historyQuery.data?.items ?? [];
    return {
      active: items.filter(s => ACTIVE_STATES.includes(s.state)),
      past: items.filter(s => !ACTIVE_STATES.includes(s.state)),
    };
  }, [historyQuery.data]);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <Text style={{fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md}}>Chats</Text>

      {historyQuery.isLoading && (
        <View>
          <SkeletonRow />
          <SkeletonRow />
        </View>
      )}
      {historyQuery.isError && <ErrorState onRetry={() => historyQuery.refetch()} />}

      {active.length > 0 && (
        <Pressable
          onPress={() => navigation.navigate('LiveConsult', {sessionId: active[0]!.id})}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primary,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.md,
          }}>
          <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: colors.online, marginRight: spacing.sm}} />
          <View style={{flex: 1}}>
            <Text style={{color: colors.onPrimary, fontWeight: '700', fontSize: 14}}>
              Active session with {active[0]!.ca_name}
            </Text>
            <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2}}>Tap to resume</Text>
          </View>
          <Text style={{color: colors.onPrimary, fontSize: 18}}>→</Text>
        </Pressable>
      )}

      <FlatList
        data={past}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          !historyQuery.isLoading ? <EmptyState icon="💬" title="No past sessions yet" description="Your consultation history will show up here." /> : null
        }
        renderItem={({item}) => <SessionRow session={item} onPress={() => navigation.navigate('LiveConsult', {sessionId: item.id})} />}
      />
    </ScreenContainer>
  );
}

function SessionRow({session, onPress}: {session: ConsultSession; onPress: () => void}): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  return (
    <Pressable
      onPress={onPress}
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
      <Avatar uri={session.ca_avatar_url} name={session.ca_name} size={44} />
      <View style={{flex: 1, marginLeft: spacing.sm}}>
        <Text style={{fontSize: 14, fontWeight: '700', color: colors.text}}>{session.ca_name}</Text>
        <Text style={{fontSize: 11.5, color: colors.textMuted, marginTop: 2}}>
          {session.mode === 'chat' ? '💬 Chat' : '📞 Call'} · {formatDateTime(session.created_at)}
        </Text>
        <Text style={{fontSize: 11, color: colors.textFaint, marginTop: 2}}>{STATE_LABELS[session.state]}</Text>
      </View>
      {session.amount_billed_paise > 0 && <Money paise={session.amount_billed_paise} size="sm" />}
    </Pressable>
  );
}
