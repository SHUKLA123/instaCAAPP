import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from '@theme/index';
import {CaAvailabilityStatus} from '@api/types';

export function StatusDot({status, size = 10}: {status: CaAvailabilityStatus; size?: number}): React.JSX.Element {
  const {colors} = useTheme();
  const colorMap: Record<CaAvailabilityStatus, string> = {
    online: colors.online,
    busy: colors.busy,
    offline: colors.offline,
  };
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorMap[status],
          borderColor: colors.card,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    borderWidth: 1.5,
  },
});
