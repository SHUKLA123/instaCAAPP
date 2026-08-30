import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@theme/index';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
}

export function Avatar({uri, name, size = 48}: AvatarProps): React.JSX.Element {
  const {colors} = useTheme();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  if (uri) {
    return <Image source={{uri}} style={{width: size, height: size, borderRadius: size / 2}} />;
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primaryLight,
        },
      ]}>
      <Text style={{color: colors.onPrimary, fontWeight: '700', fontSize: size * 0.36}}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
