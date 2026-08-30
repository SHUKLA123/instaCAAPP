import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@theme/index';

interface StepProgressProps {
  current: number;
  total: number;
  label?: string;
}

export function StepProgress({current, total, label}: StepProgressProps): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const pct = total > 0 ? Math.min(1, current / total) : 0;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={{fontSize: 12, fontWeight: '600', color: colors.textMuted}}>
          {label ?? `Step ${Math.min(current, total)} of ${total}`}
        </Text>
        <Text style={{fontSize: 12, fontWeight: '700', color: colors.primary}}>{Math.round(pct * 100)}%</Text>
      </View>
      <View
        style={[
          styles.track,
          {backgroundColor: colors.bgSubtle, borderRadius: radius.pill, marginTop: spacing.xxs},
        ]}>
        <View
          style={[
            styles.fill,
            {width: `${pct * 100}%`, backgroundColor: colors.accent, borderRadius: radius.pill},
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  track: {height: 6, width: '100%', overflow: 'hidden'},
  fill: {height: 6},
});
