import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@theme/index';
import {formatDateTime} from '@utils/date';

export interface TimelineItem {
  id: string;
  label: string;
  timestamp?: string;
  note?: string;
  state: 'done' | 'current' | 'upcoming';
}

export function Timeline({items}: {items: TimelineItem[]}): React.JSX.Element {
  const {colors, spacing} = useTheme();
  return (
    <View>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const dotColor =
          item.state === 'done' ? colors.success : item.state === 'current' ? colors.primary : colors.border;
        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.railCol}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: item.state === 'upcoming' ? colors.bgElevated : dotColor,
                    borderColor: dotColor,
                  },
                ]}
              />
              {!isLast && <View style={[styles.line, {backgroundColor: colors.border}]} />}
            </View>
            <View style={{flex: 1, paddingBottom: spacing.md}}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: item.state === 'current' ? '700' : '600',
                  color: item.state === 'upcoming' ? colors.textFaint : colors.text,
                }}>
                {item.label}
              </Text>
              {item.timestamp && (
                <Text style={{fontSize: 11.5, color: colors.textMuted, marginTop: 2}}>
                  {formatDateTime(item.timestamp)}
                </Text>
              )}
              {item.note && (
                <Text style={{fontSize: 12.5, color: colors.textMuted, marginTop: 4}}>{item.note}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row'},
  railCol: {alignItems: 'center', width: 24},
  dot: {width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 3},
  line: {flex: 1, width: 2, marginTop: 2},
});
