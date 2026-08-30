import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@theme/index';
import {Button} from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({icon = '📄', title, description, actionLabel, onAction}: EmptyStateProps): React.JSX.Element {
  const {colors, spacing} = useTheme();
  return (
    <View style={[styles.container, {padding: spacing.xl}]}>
      <Text style={{fontSize: 40, marginBottom: spacing.sm}}>{icon}</Text>
      <Text style={{fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center'}}>{title}</Text>
      {description && (
        <Text
          style={{
            fontSize: 13,
            color: colors.textMuted,
            textAlign: 'center',
            marginTop: spacing.xxs,
            lineHeight: 19,
          }}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={{marginTop: spacing.md}}>
          <Button label={actionLabel} onPress={onAction} variant="outline" size="sm" />
        </View>
      )}
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({title = 'Something went wrong', description = 'Please try again.', onRetry}: ErrorStateProps): React.JSX.Element {
  return (
    <EmptyState icon="⚠️" title={title} description={description} actionLabel={onRetry ? 'Retry' : undefined} onAction={onRetry} />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
