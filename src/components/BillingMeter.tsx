import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@theme/index';
import {formatMoney} from '@utils/money';
import {formatDuration, minutesToLabel} from '@utils/date';
import {Button} from './Button';

interface BillingMeterProps {
  elapsedSeconds: number;
  amountBilledPaise: number;
  minutesRemaining: number;
  lowBalance?: boolean;
}

/**
 * Persistent live-consult header meter. Values are ALWAYS driven by the last
 * `consult.tick` payload from the server — never a locally-running clock —
 * per the architecture doc ("the server is the source of truth"). Even the
 * elapsed-time display is the server's `elapsed_seconds`, not a client clock
 * (see useBillingMeter for the small cosmetic-only smoothing on top of it).
 */
export function BillingMeter({elapsedSeconds, amountBilledPaise, minutesRemaining}: BillingMeterProps): React.JSX.Element {
  const {colors, spacing} = useTheme();
  return (
    <View style={[styles.row, {paddingVertical: spacing.xs}]}>
      <MeterStat label="Elapsed" value={formatDuration(elapsedSeconds)} colors={colors} />
      <View style={[styles.divider, {backgroundColor: colors.border}]} />
      <MeterStat label="Spent" value={formatMoney(amountBilledPaise)} colors={colors} />
      <View style={[styles.divider, {backgroundColor: colors.border}]} />
      <MeterStat
        label="Remaining"
        value={minutesToLabel(minutesRemaining)}
        colors={colors}
        valueColor={minutesRemaining <= 1 ? colors.danger : colors.text}
      />
    </View>
  );
}

function MeterStat({label, value, colors, valueColor}: {label: string; value: string; colors: ReturnType<typeof useTheme>['colors']; valueColor?: string}): React.JSX.Element {
  return (
    <View style={styles.stat}>
      <Text style={{fontSize: 10, color: colors.textFaint, fontWeight: '600', letterSpacing: 0.3}}>
        {label.toUpperCase()}
      </Text>
      <Text style={{fontSize: 14, fontWeight: '700', color: valueColor ?? colors.text, fontVariant: ['tabular-nums']}}>
        {value}
      </Text>
    </View>
  );
}

export function LowBalanceBanner({minutesRemaining, onRecharge}: {minutesRemaining: number; onRecharge: () => void}): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  return (
    <View
      style={[
        styles.banner,
        {backgroundColor: colors.warningBg, borderColor: colors.warning, borderRadius: radius.md, padding: spacing.sm},
      ]}>
      <Text style={{flex: 1, color: colors.warning, fontSize: 12.5, fontWeight: '600'}}>
        Low balance — about {minutesToLabel(minutesRemaining)} left. Recharge to keep talking without an
        interruption.
      </Text>
      <Button label="Recharge" size="sm" variant="secondary" onPress={onRecharge} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
});
