import {apiClient, unwrap, unwrapPaged, unwrapVoid} from './client';
import {DocumentShareScope, DocumentUploadUrlResponse, VaultDocument} from './types';

export const documentsApi = {
  getUploadUrl: (payload: {file_name: string; mime: string; size_bytes: number}) =>
    unwrap<DocumentUploadUrlResponse>(apiClient.post('/documents/upload-url', payload)),

  complete: (id: string, sha256: string) =>
    unwrap<VaultDocument>(apiClient.post(`/documents/${id}/complete`, {sha256})),

  list: (params: {folder?: string; page?: number; per_page?: number}) =>
    unwrapPaged<VaultDocument>(apiClient.get('/documents', {params})),

  getDownloadUrl: (id: string) =>
    unwrap<{url: string}>(apiClient.get(`/documents/${id}/download-url`)),

  // 204 No Content
  remove: (id: string): Promise<void> => unwrapVoid(apiClient.delete(`/documents/${id}`)),

  share: (id: string, payload: {grantee_ca_id: string; scope: DocumentShareScope; ref_id: string; expires_at: string}) =>
    unwrap<{share_id: string}>(apiClient.post(`/documents/${id}/share`, payload)),

  // 204 No Content
  revokeShare: (id: string, shareId: string): Promise<void> =>
    unwrapVoid(apiClient.delete(`/documents/${id}/share/${shareId}`)),
};
