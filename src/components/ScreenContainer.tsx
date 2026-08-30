import React from 'react';
import {ScrollView, StyleSheet, View, ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '@theme/index';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({children, scroll = false, style, edges}: ScreenContainerProps): React.JSX.Element {
  const {colors, spacing} = useTheme();

  return (
    <SafeAreaView style={[styles.flex, {backgroundColor: colors.bg}]} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={[{padding: spacing.md, flexGrow: 1}, style]}>{children}</ScrollView>
      ) : (
        <View style={[styles.flex, {padding: spacing.md}, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
});
