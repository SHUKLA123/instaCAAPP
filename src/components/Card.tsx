import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '@theme/index';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({children, style, padded = true}: CardProps): React.JSX.Element {
  const {colors, radius, spacing} = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: padded ? spacing.md : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
