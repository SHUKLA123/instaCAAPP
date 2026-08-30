import React, {useCallback, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import {useQuery} from '@tanstack/react-query';
import {useTheme} from '@theme/index';
import {documentsApi} from '@api/documents';
import {VaultDocument} from '@api/types';
import {useDocumentUpload} from '@hooks/useDocumentUpload';
import {Sheet} from './Sheet';
import {Button} from './Button';

interface DocPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  label?: string;
}

/** Attach documents to an intake / order requirement — upload fresh via the
 * native document picker, or pick existing files already in the vault. */
export function DocPicker({selectedIds, onChange, multiple = true, label}: DocPickerProps): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const [vaultOpen, setVaultOpen] = useState(false);
  const upload = useDocumentUpload();
  const vaultQuery = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list({}),
    enabled: vaultOpen,
  });

  const toggle = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter(existing => existing !== id));
      } else {
        onChange(multiple ? [...selectedIds, id] : [id]);
      }
    },
    [selectedIds, onChange, multiple],
  );

  const handleUploadNew = useCallback(async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        allowMultiSelection: multiple,
      });
      for (const res of results) {
        const doc = await upload.mutateAsync({
          uri: res.uri,
          name: res.name ?? 'document',
          type: res.type ?? 'application/octet-stream',
          size: res.size ?? 0,
        });
        toggle(doc.id);
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) return;
      // eslint-disable-next-line no-console
      console.warn('document pick failed', err);
    }
  }, [multiple, upload, toggle]);

  return (
    <View>
      {label && <Text style={{fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs}}>{label}</Text>}
      <View style={styles.actionsRow}>
        <Button
          label={upload.isPending ? 'Uploading…' : 'Upload new'}
          variant="outline"
          size="sm"
          loading={upload.isPending}
          onPress={handleUploadNew}
        />
        <Button label="Choose from vault" variant="ghost" size="sm" onPress={() => setVaultOpen(true)} />
      </View>

      {selectedIds.length > 0 && (
        <View style={[styles.chipsWrap, {marginTop: spacing.sm}]}>
          {selectedIds.map(id => (
            <Pressable
              key={id}
              onPress={() => toggle(id)}
              style={[styles.chip, {backgroundColor: colors.bgSubtle, borderRadius: radius.sm, borderColor: colors.border}]}>
              <Text style={{fontSize: 12, color: colors.text}} numberOfLines={1}>
                📎 Document
              </Text>
              <Text style={{fontSize: 12, color: colors.danger, marginLeft: 6, fontWeight: '700'}}>✕</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Sheet visible={vaultOpen} onClose={() => setVaultOpen(false)} title="Select from your vault">
        {vaultQuery.isLoading && <ActivityIndicator color={colors.primary} style={{marginVertical: spacing.lg}} />}
        {vaultQuery.data?.items.length === 0 && (
          <Text style={{color: colors.textMuted, textAlign: 'center', marginVertical: spacing.lg}}>
            No documents in your vault yet.
          </Text>
        )}
        {vaultQuery.data?.items.map((doc: VaultDocument) => {
          const isSelected = selectedIds.includes(doc.id);
          return (
            <Pressable
              key={doc.id}
              onPress={() => toggle(doc.id)}
              style={[
                styles.vaultRow,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.bgSubtle : 'transparent',
                  borderRadius: radius.md,
                  marginBottom: spacing.xs,
                },
              ]}>
              <Text style={{flex: 1, color: colors.text, fontSize: 13.5}} numberOfLines={1}>
                {doc.original_name}
              </Text>
              <Text style={{color: isSelected ? colors.primary : colors.textFaint, fontWeight: '700'}}>
                {isSelected ? '✓' : ''}
              </Text>
            </Pressable>
          );
        })}
        <Button label="Done" onPress={() => setVaultOpen(false)} fullWidth style={{marginTop: spacing.md}} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {flexDirection: 'row', gap: 10},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 200,
  },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
  },
});
