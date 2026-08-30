import {useMutation, useQueryClient} from '@tanstack/react-query';
import {documentsApi} from '@api/documents';
import {VaultDocument} from '@api/types';
import {sha256Hex} from '@utils/sha256';

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

async function uploadFile(file: PickedFile): Promise<VaultDocument> {
  const {document_id, upload_url, headers} = await documentsApi.getUploadUrl({
    file_name: file.name,
    mime: file.type,
    size_bytes: file.size,
  });

  const fileResponse = await fetch(file.uri);
  const blob = await fileResponse.blob();
  const putResponse = await fetch(upload_url, {
    method: 'PUT',
    headers: {...headers, 'Content-Type': file.type},
    body: blob,
  });
  if (!putResponse.ok) {
    throw new Error(`Upload failed with status ${putResponse.status}`);
  }

  const digest = sha256Hex(`${file.uri}:${file.name}:${file.size}:${Date.now()}`);
  return documentsApi.complete(document_id, digest);
}

/** Uploads a locally picked file to the vault: presigned URL -> PUT -> /complete. */
export function useDocumentUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['documents']});
    },
  });
}
