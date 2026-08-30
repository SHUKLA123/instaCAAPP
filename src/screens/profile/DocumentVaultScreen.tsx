import React from 'react';
import {Alert, FlatList, Pressable, Text, View} from 'react-native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {SkeletonRow} from '@components/Skeleton';
import {EmptyState, ErrorState} from '@components/EmptyState';
import {Button} from '@components/Button';
import {useTheme} from '@theme/index';
import {documentsApi} from '@api/documents';
import {VaultDocument} from '@api/types';
import {useDocumentUpload} from '@hooks/useDocumentUpload';
import DocumentPicker from 'react-native-document-picker';
import {formatDate} from '@utils/date';

export function DocumentVaultScreen(): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const queryClient = useQueryClient();
  const upload = useDocumentUpload();

  const docsQuery = useQuery({queryKey: ['documents'], queryFn: () => documentsApi.list({})});

  const handleUpload = async () => {
    try {
      const results = await DocumentPicker.pick({type: [DocumentPicker.types.pdf, DocumentPicker.types.images], allowMultiSelection: true});
      for (const res of results) {
        await upload.mutateAsync({uri: res.uri, name: res.name ?? 'document', type: res.type ?? 'application/octet-stream', size: res.size ?? 0});
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) Alert.alert('Upload failed', 'Please try again.');
    }
  };

  const handleDelete = (doc: VaultDocument) => {
    Alert.alert('Delete document?', doc.original_name, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await documentsApi.remove(doc.id);
          queryClient.invalidateQueries({queryKey: ['documents']});
        },
      },
    ]);
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Button label={upload.isPending ? 'Uploading…' : 'Upload a document'} onPress={handleUpload} loading={upload.isPending} fullWidth style={{marginBottom: spacing.md}} />

      {docsQuery.isLoading && (
        <View>
          <SkeletonRow />
          <SkeletonRow />
        </View>
      )}
      {docsQuery.isError && <ErrorState onRetry={() => docsQuery.refetch()} />}

      <FlatList
        data={docsQuery.data?.items ?? []}
        keyExtractor={item => item.id}
        ListEmptyComponent={!docsQuery.isLoading ? <EmptyState icon="📁" title="Your vault is empty" description="Upload PAN, GSTIN, or supporting documents to reuse them across consults and filings." /> : null}
        renderItem={({item}) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.sm,
              marginBottom: spacing.xs,
            }}>
            <Text style={{fontSize: 20, marginRight: spacing.sm}}>{item.mime.includes('pdf') ? '📄' : '🖼️'}</Text>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 13.5, color: colors.text, fontWeight: '600'}} numberOfLines={1}>
                {item.original_name}
              </Text>
              <Text style={{fontSize: 11, color: colors.textFaint, marginTop: 2}}>
                {(item.size_bytes / 1024).toFixed(0)} KB · {formatDate(item.created_at)}
              </Text>
            </View>
            <Pressable onPress={() => handleDelete(item)} style={{padding: 6}}>
              <Text style={{color: colors.danger, fontSize: 13}}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
