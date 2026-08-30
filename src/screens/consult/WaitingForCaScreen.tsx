import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Avatar} from '@components/Avatar';
import {Button} from '@components/Button';
import {useTheme} from '@theme/index';
import {consultApi} from '@api/consult';
import {consultSocket} from '@ws/socket';
import {ConsultStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<ConsultStackParamList, 'WaitingForCa'>;

export function WaitingForCaScreen({route, navigation}: Props): React.JSX.Element {
  const {sessionId, caId, caName, mode} = route.params;
  const {colors, spacing} = useTheme();

  const sessionQuery = useQuery({
    queryKey: ['consult-session', sessionId],
    queryFn: () => consultApi.getSession(sessionId),
  });

  const [secondsLeft, setSecondsLeft] = useState(60);
  const [outcome, setOutcome] = useState<'pending' | 'rejected' | 'expired'>('pending');

  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const unsubAccepted = consultSocket.on('consult.accepted', payload => {
      if (payload.session_id === sessionId) {
        navigation.replace('LiveConsult', {sessionId});
      }
    });
    const unsubRejected = consultSocket.on('consult.rejected', payload => {
      if (payload.session_id === sessionId) setOutcome('rejected');
    });
    const unsubExpired = consultSocket.on('consult.expired', payload => {
      if (payload.session_id === sessionId) setOutcome('expired');
    });
    return () => {
      unsubAccepted();
      unsubRejected();
      unsubExpired();
    };
  }, [sessionId, navigation]);

  useEffect(() => {
    if (secondsLeft === 0 && outcome === 'pending') {
      setOutcome('expired');
    }
  }, [secondsLeft, outcome]);

  if (outcome !== 'pending') {
    return (
      <ScreenContainer>
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{fontSize: 40, marginBottom: spacing.sm}}>{outcome === 'rejected' ? '😕' : '⏱️'}</Text>
          <Text style={{fontSize: 18, fontWeight: '700', color: colors.text}}>
            {outcome === 'rejected' ? `${caName} isn't available right now` : 'No response in time'}
          </Text>
          <Text style={{fontSize: 13, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center'}}>
            You have not been charged. Try again or find another CA.
          </Text>
          <Button label="Go back" onPress={() => navigation.navigate('CaProfile', {caId})} style={{marginTop: spacing.lg}} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Avatar name={caName} size={88} />
        <Text style={{fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.md}}>
          Waiting for {caName} to accept…
        </Text>
        <Text style={{fontSize: 13, color: colors.textMuted, marginTop: spacing.xxs}}>
          {mode === 'chat' ? 'Chat' : 'Call'} request sent
        </Text>

        <View style={{marginTop: spacing.lg, alignItems: 'center'}}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{fontSize: 32, fontWeight: '700', color: colors.primary, marginTop: spacing.sm, fontVariant: ['tabular-nums']}}>
            {secondsLeft}s
          </Text>
        </View>

        <Button
          label="Cancel request"
          variant="ghost"
          onPress={async () => {
            await consultApi.end(sessionId, 'client_cancelled');
            navigation.navigate('CaProfile', {caId});
          }}
          style={{marginTop: spacing.xl}}
        />
      </View>
    </ScreenContainer>
  );
}
