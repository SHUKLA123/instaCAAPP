import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@theme/index';
import {CaProfileSummary} from '@api/types';
import {formatRatePerMinute} from '@utils/money';
import {Avatar} from './Avatar';
import {StatusDot} from './StatusDot';
import {RatingStars} from './RatingStars';

export function CaCard({ca, onPress}: {ca: CaProfileSummary; onPress: () => void}): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.sm},
      ]}>
      <View style={styles.avatarWrap}>
        <Avatar uri={ca.avatar_url} name={ca.name} size={56} />
        <View style={styles.dotWrap}>
          <StatusDot status={ca.status} size={12} />
        </View>
      </View>

      <View style={{flex: 1, marginLeft: spacing.sm}}>
        <View style={styles.rowBetween}>
          <Text style={{fontSize: 15.5, fontWeight: '700', color: colors.text}} numberOfLines={1}>
            {ca.name}
          </Text>
          <RatingStars rating={ca.rating} count={ca.rating_count} />
        </View>

        <Text style={{fontSize: 12.5, color: colors.textMuted, marginTop: 2}} numberOfLines={1}>
          {ca.specializations.slice(0, 3).join(' · ') || 'General practice'}
        </Text>
        <Text style={{fontSize: 12, color: colors.textFaint, marginTop: 1}} numberOfLines={1}>
          {ca.experience_years}+ yrs experience · {ca.languages.slice(0, 3).join(', ')}
        </Text>

        <View style={[styles.rowBetween, {marginTop: spacing.xs}]}>
          <RateBadge label="Chat" paise={ca.chat_rate_gross_paise} colors={colors} radius={radius} />
          <RateBadge label="Call" paise={ca.call_rate_gross_paise} colors={colors} radius={radius} />
        </View>
      </View>
    </Pressable>
  );
}

function RateBadge({
  label,
  paise,
  colors,
  radius,
}: {
  label: string;
  paise: number;
  colors: ReturnType<typeof useTheme>['colors'];
  radius: ReturnType<typeof useTheme>['radius'];
}): React.JSX.Element {
  return (
    <View style={[styles.badge, {backgroundColor: colors.bgSubtle, borderRadius: radius.sm}]}>
      <Text style={{fontSize: 11, color: colors.textMuted, fontWeight: '600'}}>{label} </Text>
      <Text style={{fontSize: 11.5, color: colors.text, fontWeight: '700'}}>{formatRatePerMinute(paise)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  avatarWrap: {position: 'relative'},
  dotWrap: {position: 'absolute', bottom: 0, right: 0},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  badge: {paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center'},
});
