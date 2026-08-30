import {apiClient, unwrap, unwrapPaged, unwrapVoid} from './client';
import {OrderAnswer, OrderState, RazorpayOrderRef, ServiceCategory, ServiceDetail, ServiceListItem, ServiceOrder, ServiceOrderSummary} from './types';

export const servicesApi = {
  // Plain arrays in `data` — small bounded catalog lists, not paginated.
  categories: () => unwrap<ServiceCategory[]>(apiClient.get('/services/categories')),

  list: (params: {category?: string; q?: string}) =>
    unwrap<ServiceListItem[]>(apiClient.get('/services', {params})),

  getBySlug: (slug: string) => unwrap<ServiceDetail>(apiClient.get(`/services/${slug}`)),
};

export const ordersApi = {
  create: (payload: {service_id: string; answers: OrderAnswer[]}) =>
    unwrap<ServiceOrder>(apiClient.post('/orders', payload)),

  list: (params: {role: 'client' | 'ca'; state?: OrderState; page?: number; per_page?: number}) =>
    unwrapPaged<ServiceOrderSummary>(apiClient.get('/orders', {params})),

  getById: (id: string) => unwrap<ServiceOrder>(apiClient.get(`/orders/${id}`)),

  updateRequirements: (id: string, answers: OrderAnswer[]) =>
    unwrap<ServiceOrder>(apiClient.patch(`/orders/${id}/requirements`, {answers})),

  pay: (id: string) => unwrap<RazorpayOrderRef>(apiClient.post(`/orders/${id}/pay`)),

  payVerify: (id: string, payload: {razorpay_order_id: string; payment_id: string; signature: string}) =>
    unwrap<ServiceOrder>(apiClient.post(`/orders/${id}/pay/verify`, payload)),

  // 204 No Content
  cancel: (id: string): Promise<void> => unwrapVoid(apiClient.post(`/orders/${id}/cancel`)),

  transition: (id: string, payload: {to_state: OrderState; note?: string}) =>
    unwrap<ServiceOrder>(apiClient.post(`/orders/${id}/transition`, payload)),

  addDeliverable: (id: string, payload: {document_id: string; label: string}) =>
    unwrap<ServiceOrder>(apiClient.post(`/orders/${id}/deliverables`, payload)),
};
