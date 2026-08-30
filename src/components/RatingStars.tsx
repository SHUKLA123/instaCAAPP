import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@theme/index';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
  editable?: boolean;
  onChange?: (rating: number) => void;
}

export function RatingStars({rating, count, size = 14, editable, onChange}: RatingStarsProps): React.JSX.Element {
  const {colors, spacing} = useTheme();
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map(star => {
        const filled = star <= Math.round(rating);
        const StarEl = editable ? Pressable : View;
        return (
          <StarEl key={star} onPress={editable ? () => onChange?.(star) : undefined}>
            <Text style={{fontSize: size, color: filled ? colors.warning : colors.textFaint}}>★</Text>
          </StarEl>
        );
      })}
      {count !== undefined && (
        <Text style={{marginLeft: spacing.xxs, fontSize: 12, color: colors.textMuted}}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 2},
});
