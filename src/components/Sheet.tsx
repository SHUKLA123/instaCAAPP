import React from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@theme/index';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** disables outside-tap dismiss, e.g. for the intake sheet where a stray tap shouldn't lose input */
  dismissOnBackdrop?: boolean;
}

export function Sheet({visible, onClose, title, children, dismissOnBackdrop = true}: SheetProps): React.JSX.Element {
  const {colors, radius, spacing} = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, {backgroundColor: colors.overlay}]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissOnBackdrop ? onClose : undefined} />
        <View
          style={[
            styles.sheet,
            {backgroundColor: colors.bgElevated, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl},
          ]}>
          <View style={[styles.grabber, {backgroundColor: colors.border}]} />
          {title && (
            <View style={{paddingHorizontal: spacing.lg, paddingBottom: spacing.sm}}>
              <Text style={{fontSize: 18, fontWeight: '700', color: colors.text}}>{title}</Text>
            </View>
          )}
          <ScrollView
            style={{maxHeight: '100%'}}
            contentContainerStyle={{paddingHorizontal: spacing.lg, paddingBottom: spacing.xl}}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
});
