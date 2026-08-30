import {apiClient, unwrap, unwrapPaged} from './client';
import {Invoice} from './types';

export const invoicesApi = {
  list: (page = 1, perPage?: number) =>
    unwrapPaged<Invoice>(apiClient.get('/invoices', {params: {page, per_page: perPage}})),

  getPdfUrl: (id: string) => unwrap<{url: string}>(apiClient.get(`/invoices/${id}/pdf`)),
};
