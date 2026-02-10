import { api } from './client';
import type {
  LoginResponse,
  ChatHistoryParams,
  ChatHistoryResponse,
  ChatMessagesResponse,
  BookingsParams,
  BookingsResponse,
  DocumentItem,
  DocumentViewResponse,
  MessageAnalyticsResponse,
  BookingAnalyticsResponse,
  ConversationAnalyticsResponse,
  GuestAnalyticsResponse,
  PaymentContextResponse,
  PaymentSubmitRequest,
  PaymentSubmitResponse,
} from '../types/api';

export const auth = {
  login: (email: string, password: string) =>
    api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),
  forgotPassword: (email: string) =>
    api<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),
  resetPassword: (token: string, newPassword: string) =>
    api<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
      skipAuth: true,
    }),
};

export const chat = {
  history: (params: ChatHistoryParams) => {
    const q = new URLSearchParams();
    q.set('propertyId', params.propertyId);
    if (params.status) q.set('status', params.status);
    if (params.platform && params.platform !== 'all') q.set('platform', params.platform);
    if (params.dateFrom) q.set('dateFrom', params.dateFrom);
    if (params.dateTo) q.set('dateTo', params.dateTo);
    if (params.guestPhone) q.set('guestPhone', params.guestPhone);
    if (params.search) q.set('search', params.search);
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.offset != null) q.set('offset', String(params.offset));
    return api<ChatHistoryResponse>(`/api/chat/history?${q.toString()}`);
  },
  messages: (sessionId: string) =>
    api<ChatMessagesResponse>(`/api/chat/history/${sessionId}/messages`),
};

export const bookings = {
  list: (params: BookingsParams) => {
    const q = new URLSearchParams();
    if (params.page != null) q.set('page', String(params.page));
    if (params.pageSize != null) q.set('pageSize', String(params.pageSize));
    if (params.platform) q.set('platform', params.platform);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    if (params.status) q.set('status', params.status);
    return api<BookingsResponse>(`/bookings?${q.toString()}`);
  },
};

export const documents = {
  list: (propertyId: string) =>
    api<DocumentItem[]>(`/documents?propertyId=${encodeURIComponent(propertyId)}`),
  /** Get document metadata + presigned viewUrl (GET /documents/:id). Use viewUrl in iframe or download. */
  get: (id: string) => api<DocumentViewResponse>(`/documents/${id}`),
  replace: (id: string, formData: FormData) =>
    api<{ message: string; url: string }>(`/documents/${id}/replace`, {
      method: 'PUT',
      body: formData,
      headers: {},
    }),
};

/** Public payment flow (no auth). Token from payment link query. */
export const payments = {
  getContext: (token: string) =>
    api<PaymentContextResponse>(`/public/payments/context?token=${encodeURIComponent(token)}`, {
      skipAuth: true,
    }),
  submit: (payload: PaymentSubmitRequest) =>
    api<PaymentSubmitResponse>('/public/payments/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    }),
};

export const analytics = {
  messages: (propertyId: string, startDate: string, endDate: string, groupBy?: 'day') => {
    const q = new URLSearchParams({ startDate, endDate });
    if (groupBy) q.set('groupBy', groupBy);
    return api<MessageAnalyticsResponse>(`/analytics/${propertyId}/messages?${q.toString()}`);
  },
  bookings: (propertyId: string, startDate: string, endDate: string, groupBy?: 'day') => {
    const q = new URLSearchParams({ startDate, endDate });
    if (groupBy) q.set('groupBy', groupBy);
    return api<BookingAnalyticsResponse>(`/analytics/${propertyId}/bookings?${q.toString()}`);
  },
  conversations: (propertyId: string, startDate: string, endDate: string, groupBy?: 'day') => {
    const q = new URLSearchParams({ startDate, endDate });
    if (groupBy) q.set('groupBy', groupBy);
    return api<ConversationAnalyticsResponse>(`/analytics/${propertyId}/conversations?${q.toString()}`);
  },
  guests: (propertyId: string, startDate: string, endDate: string, topN?: number) => {
    const q = new URLSearchParams({ startDate, endDate });
    if (topN != null) q.set('topN', String(topN));
    return api<GuestAnalyticsResponse>(`/analytics/${propertyId}/guests?${q.toString()}`);
  },
};
