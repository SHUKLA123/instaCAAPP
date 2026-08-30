import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {useTheme} from '@theme/index';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
}

export function Chip({label, selected, onPress, icon}: ChipProps): React.JSX.Element {
  const {colors, radius, spacing} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          borderRadius: radius.pill,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          backgroundColor: selected ? colors.primary : colors.bgSubtle,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}>
      <Text style={{color: selected ? colors.onPrimary : colors.text, fontSize: 13, fontWeight: '600'}}>
        {icon ? `${icon} ` : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
