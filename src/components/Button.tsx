import React from 'react';
import {ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text, ViewStyle} from 'react-native';
import {useTheme} from '@theme/index';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'sm';

interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  style,
  testID,
}: ButtonProps): React.JSX.Element {
  const {colors, radius, spacing} = useTheme();
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.accent,
    outline: 'transparent',
    ghost: 'transparent',
    danger: colors.danger,
  };
  const fg: Record<Variant, string> = {
    primary: colors.onPrimary,
    secondary: colors.onAccent,
    outline: colors.primary,
    ghost: colors.primary,
    danger: '#FFFFFF',
  };
  const borderColor: Record<Variant, string | undefined> = {
    primary: undefined,
    secondary: undefined,
    outline: colors.primary,
    ghost: undefined,
    danger: undefined,
  };
  const padY: Record<Size, number> = {sm: spacing.xs, md: spacing.sm, lg: spacing.md};

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({pressed}) => [
        styles.base,
        {
          backgroundColor: bg[variant],
          borderRadius: radius.md,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: borderColor[variant],
          paddingVertical: padY[size],
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <Text style={[styles.label, {color: fg[variant], fontSize: size === 'lg' ? 16 : 15}]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  label: {
    fontWeight: '600',
  },
});
