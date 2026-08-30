import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NavigationProp, RouteProp, StackActions} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Avatar} from '@components/Avatar';
import {ErrorState} from '@components/EmptyState';
import {BillingMeter, LowBalanceBanner} from '@components/BillingMeter';
import {useTheme} from '@theme/index';
import {consultApi} from '@api/consult';
import {ApiError} from '@api/client';
import {useBillingMeter} from '@hooks/useBillingMeter';
import {useConsultStore} from '@store/consult';
import {TabParamList} from '@navigation/types';
import {ChatPanel} from './ChatPanel';
import {CallPanel} from './CallPanel';
import {SessionSummarySheet} from './SessionSummarySheet';

/**
 * LiveConsultScreen is mounted from two independent stack navigators
 * (Consult tab and Chats tab — the "resume into the live consult" banner).
 * It's typed against a minimal, stack-agnostic param list rather than either
 * concrete *StackParamList so it satisfies both call sites structurally.
 */
type LiveConsultOnlyParamList = {LiveConsult: {sessionId: string}};

interface Props {
  route: RouteProp<LiveConsultOnlyParamList, 'LiveConsult'>;
  navigation: NavigationProp<LiveConsultOnlyParamList, 'LiveConsult'>;
}

export function LiveConsultScreen({route, navigation}: Props): React.JSX.Element {
  const {sessionId} = route.params;
  const {colors, spacing} = useTheme();
  const [ending, setEnding] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ['consult-session', sessionId],
    queryFn: () => consultApi.getSession(sessionId),
  });

  const meter = useBillingMeter(sessionId);
  const endedSummary = useConsultStore(s => s.endedSummary);
  const clearSession = useConsultStore(s => s.clearSession);

  const confirmEnd = () => {
    Alert.alert('End session?', 'This will stop the meter and end your consultation.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'End session',
        style: 'destructive',
        onPress: async () => {
          setEnding(true);
          try {
            await consultApi.end(sessionId, 'client_ended');
          } catch (err) {
            // INVALID_SESSION_STATE typically means the session already
            // ended server-side (e.g. the CA ended it a moment earlier) —
            // the `consult.ended` WS event will still land and drive the
            // summary sheet, so this is informational, not a hard failure.
            if (err instanceof ApiError && err.code === 'INVALID_SESSION_STATE') {
              Alert.alert('Session already ended', 'This consult has already been closed.');
            } else {
              Alert.alert('Could not end session', err instanceof ApiError ? err.message : 'Please try again.');
            }
          } finally {
            setEnding(false);
          }
        },
      },
    ]);
  };

  if (sessionQuery.isLoading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} style={{marginTop: spacing.xxl}} />
      </ScreenContainer>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => sessionQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const session = sessionQuery.data;
  const showSummary = endedSummary?.sessionId === sessionId;

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={{padding: 0}}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, {borderBottomColor: colors.border, paddingHorizontal: spacing.md}]}>
          <View style={styles.headerTop}>
            <View style={styles.peerRow}>
              <Avatar uri={session.ca_avatar_url} name={session.ca_name} size={36} />
              <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 8}}>{session.ca_name}</Text>
            </View>
            <Pressable onPress={confirmEnd} disabled={ending}>
              <Text style={{color: colors.danger, fontWeight: '700', fontSize: 13}}>{ending ? 'Ending…' : 'End'}</Text>
            </Pressable>
          </View>

          {meter && (
            <BillingMeter
              elapsedSeconds={meter.elapsedSeconds}
              amountBilledPaise={meter.amountBilledPaise}
              minutesRemaining={meter.minutesRemaining}
              lowBalance={meter.lowBalance}
            />
          )}
        </View>

        {meter?.lowBalance && (
          <View style={{paddingHorizontal: spacing.md, paddingTop: spacing.sm}}>
            <LowBalanceBanner
              minutesRemaining={meter.minutesRemaining}
              onRecharge={() => {
                const tabNav = navigation.getParent<BottomTabNavigationProp<TabParamList>>();
                tabNav?.navigate('WalletTab', {screen: 'Recharge'});
              }}
            />
          </View>
        )}

        {session.mode === 'chat' ? (
          <ChatPanel sessionId={sessionId} peerName={session.ca_name} />
        ) : (
          <CallPanel sessionId={sessionId} peerName={session.ca_name} peerAvatarUrl={session.ca_avatar_url} />
        )}
      </KeyboardAvoidingView>

      {showSummary && endedSummary && (
        <SessionSummarySheet
          visible
          sessionId={sessionId}
          reason={endedSummary.reason}
          summary={endedSummary.summary}
          onDone={() => {
            clearSession();
            navigation.dispatch(StackActions.popToTop());
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
    paddingTop: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  peerRow: {flexDirection: 'row', alignItems: 'center'},
});
