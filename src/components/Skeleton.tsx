import React, {useEffect, useRef} from 'react';
import {Animated, View, ViewStyle} from 'react-native';
import {useTheme} from '@theme/index';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({width = '100%', height = 14, radius = 6, style}: SkeletonProps): React.JSX.Element {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 1, duration: 650, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 0.5, duration: 650, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {width, height, borderRadius: radius, backgroundColor: colors.skeleton, opacity},
        style,
      ]}
    />
  );
}

export function SkeletonCaCard(): React.JSX.Element {
  const {spacing, radius: radii, colors} = useTheme();
  return (
    <View style={{flexDirection: 'row', padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.card, marginBottom: spacing.sm, gap: spacing.sm}}>
      <Skeleton width={56} height={56} radius={28} />
      <View style={{flex: 1, gap: 8}}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="90%" height={12} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonRow({height = 60}: {height?: number}): React.JSX.Element {
  const {spacing, radius: radii, colors} = useTheme();
  return (
    <View style={{padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.card, marginBottom: spacing.sm}}>
      <Skeleton width="70%" height={14} style={{marginBottom: 8}} />
      <Skeleton width="40%" height={height > 60 ? 12 : 12} />
    </View>
  );
}
