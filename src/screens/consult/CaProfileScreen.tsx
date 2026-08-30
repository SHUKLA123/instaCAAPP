import React, {useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Avatar} from '@components/Avatar';
import {StatusDot} from '@components/StatusDot';
import {RatingStars} from '@components/RatingStars';
import {Card} from '@components/Card';
import {Button} from '@components/Button';
import {ErrorState} from '@components/EmptyState';
import {useTheme} from '@theme/index';
import {casApi} from '@api/cas';
import {ConsultMode} from '@api/types';
import {formatRatePerMinute} from '@utils/money';
import {ConsultStackParamList, TabParamList} from '@navigation/types';
import {IntakeSheet} from './IntakeSheet';

type Props = NativeStackScreenProps<ConsultStackParamList, 'CaProfile'>;

export function CaProfileScreen({route, navigation}: Props): React.JSX.Element {
  const {caId} = route.params;
  const {colors, spacing, radius} = useTheme();
  const [intakeMode, setIntakeMode] = useState<ConsultMode | null>(null);

  const caQuery = useQuery({queryKey: ['ca', caId], queryFn: () => casApi.getById(caId)});
  const reviewsQuery = useQuery({
    queryKey: ['ca-reviews', caId],
    queryFn: () => casApi.getReviews(caId, 1),
    enabled: !!caQuery.data,
  });

  if (caQuery.isLoading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} style={{marginTop: spacing.xxl}} />
      </ScreenContainer>
    );
  }

  if (caQuery.isError || !caQuery.data) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => caQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const ca = caQuery.data;

  return (
    <ScreenContainer scroll edges={['left', 'right']}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md}}>
        <View>
          <Avatar uri={ca.avatar_url} name={ca.name} size={72} />
          <View style={{position: 'absolute', bottom: 2, right: 2}}>
            <StatusDot status={ca.status} size={16} />
          </View>
        </View>
        <View style={{marginLeft: spacing.md, flex: 1}}>
          <Text style={{fontSize: 19, fontWeight: '700', color: colors.text}}>{ca.name}</Text>
          {ca.firm && <Text style={{fontSize: 13, color: colors.textMuted}}>{ca.firm}</Text>}
          <RatingStars rating={ca.rating} count={ca.rating_count} size={15} />
        </View>
      </View>

      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md}}>
        {ca.specializations.map(spec => (
          <View key={spec} style={{backgroundColor: colors.bgSubtle, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4}}>
            <Text style={{fontSize: 12, color: colors.text, fontWeight: '600'}}>{spec}</Text>
          </View>
        ))}
      </View>

      <Card style={{marginBottom: spacing.md}}>
        <Row label="Experience" value={`${ca.experience_years}+ years`} colors={colors} />
        <Row label="Languages" value={ca.languages.join(', ')} colors={colors} />
        <Row label="ICAI Membership" value={ca.membership_no_masked ?? '—'} colors={colors} />
        <Row label="Verified" value={ca.verified ? 'Yes' : 'Pending'} colors={colors} last />
      </Card>

      {ca.bio && (
        <Card style={{marginBottom: spacing.md}}>
          <Text style={{fontSize: 13, color: colors.text, lineHeight: 20}}>{ca.bio}</Text>
        </Card>
      )}

      <View style={{flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md}}>
        <Card padded={false} style={{flex: 1, padding: spacing.md, alignItems: 'center'}}>
          <Text style={{fontSize: 11, color: colors.textMuted, fontWeight: '600'}}>CHAT</Text>
          <Text style={{fontSize: 16, fontWeight: '700', color: colors.text}}>{formatRatePerMinute(ca.chat_rate_gross_paise)}</Text>
        </Card>
        <Card padded={false} style={{flex: 1, padding: spacing.md, alignItems: 'center'}}>
          <Text style={{fontSize: 11, color: colors.textMuted, fontWeight: '600'}}>CALL</Text>
          <Text style={{fontSize: 16, fontWeight: '700', color: colors.text}}>{formatRatePerMinute(ca.call_rate_gross_paise)}</Text>
        </Card>
      </View>

      {reviewsQuery.data && reviewsQuery.data.items.length > 0 && (
        <View style={{marginBottom: spacing.xl}}>
          <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>Reviews</Text>
          {reviewsQuery.data.items.map(review => (
            <Card key={review.id} style={{marginBottom: spacing.xs}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{fontWeight: '600', color: colors.text, fontSize: 13}}>{review.client_name}</Text>
                <RatingStars rating={review.rating} size={12} />
              </View>
              {review.comment && <Text style={{color: colors.textMuted, fontSize: 12.5, marginTop: 4}}>{review.comment}</Text>}
            </Card>
          ))}
        </View>
      )}

      <View style={{flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl}}>
        <Button label="💬 Chat" onPress={() => setIntakeMode('chat')} variant="outline" style={{flex: 1}} disabled={ca.status === 'offline'} />
        <Button label="📞 Call" onPress={() => setIntakeMode('call')} style={{flex: 1}} disabled={ca.status === 'offline'} />
      </View>

      {intakeMode && (
        <IntakeSheet
          visible={!!intakeMode}
          onClose={() => setIntakeMode(null)}
          ca={ca}
          mode={intakeMode}
          onStarted={({sessionId}) => {
            setIntakeMode(null);
            navigation.navigate('WaitingForCa', {sessionId, caId: ca.id, caName: ca.name, mode: intakeMode});
          }}
          onNeedRecharge={shortfallPaise => {
            setIntakeMode(null);
            const tabNav = navigation.getParent<BottomTabNavigationProp<TabParamList>>();
            tabNav?.navigate('WalletTab', {screen: 'Recharge', params: {suggestedAmountPaise: shortfallPaise}});
          }}
        />
      )}
    </ScreenContainer>
  );
}

function Row({label, value, colors, last}: {label: string; value: string; colors: ReturnType<typeof useTheme>['colors']; last?: boolean}): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}>
      <Text style={{fontSize: 13, color: colors.textMuted}}>{label}</Text>
      <Text style={{fontSize: 13, color: colors.text, fontWeight: '600'}}>{value}</Text>
    </View>
  );
}
