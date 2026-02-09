export interface User {
  userId: string;
  email: string;
  propertyId: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface ChatHistoryParams {
  propertyId: string;
  status?: 'active' | 'closed' | 'all';
  platform?: 'web' | 'whatsapp' | 'sms' | 'all';
  dateFrom?: string;
  dateTo?: string;
  guestPhone?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AssignedStaff {
  id: string;
  name: string;
}

export interface Conversation {
  sessionId: string;
  guestPhone: string;
  guestName?: string;
  assignedStaff?: AssignedStaff;
  status: 'active' | 'closed';
  startedAt: string;
  endedAt?: string;
  duration?: string;
  messageCount: number;
  lastMessage?: string;
  platform: 'whatsapp' | 'sms' | 'web';
  unitNumber?: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}

export interface ChatSession {
  sessionId: string;
  propertyId: string;
  guestPhone: string;
  guestName?: string;
  assignedStaff?: AssignedStaff;
  status: string;
  startedAt: string;
  endedAt?: string;
  unitNumber?: string;
  platform: string;
}

export interface Attachment {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderType: 'guest' | 'staff' | 'system';
  senderName?: string;
  sentAt: string;
  messageType: string;
  attachments: Attachment[];
  isTemplate: boolean;
  templateId?: string;
}

export interface ChatMessagesResponse {
  success: boolean;
  session: ChatSession;
  messages: ChatMessage[];
  totalMessages: number;
}

export interface BookingsParams {
  page?: number;
  pageSize?: number;
  platform?: 'whatsapp' | 'sms' | 'web';
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface BookingCustomer {
  id?: string;
  shortId?: string;
  name?: string;
  phoneNumber?: string;
  email?: string;
  countryCode?: string;
  createdAt?: string;
  isTestData?: boolean;
}

export interface Booking {
  id: string;
  shortId?: string;
  confirmationCode?: string;
  externalConfirmationCode?: string;
  status?: string;
  platform?: string;
  customer?: BookingCustomer;
  unitNumber?: string;
  createdAt?: string;
  checkInDate?: string;
  checkOutDate?: string;
  totalPrice?: number;
  totalAmount?: number | string;
  currency?: string;
  bookingSource?: string;
  [key: string]: unknown;
}

export interface BookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  uploadedAt: string;
}

/** Response from GET /documents/:id — metadata plus presigned viewUrl (expires e.g. 1 hour). */
export interface DocumentViewResponse {
  id: string;
  name: string;
  description: string | null;
  type: string;
  uploadedAt: string;
  viewUrl: string;
}

export interface MessageAnalyticsResponse {
  totalMessages: number;
  byPlatform: { whatsapp: number; sms: number; web: number };
  byType: { booking: number; concierge: number };
  daily?: { date: string; total: number; byPlatform: Record<string, number>; byType: Record<string, number> }[];
}

export interface BookingAnalyticsResponse {
  totalBookings: number;
  overTime: { date: string; count: number }[];
  conversion: Record<string, number>;
  byPlatform: Record<string, number>;
  bySource: Record<string, number>;
  averageLengthOfStayNights: number;
}

export interface ConversationAnalyticsResponse {
  totalSessions: number;
  overTime: { date: string; count: number }[];
  peakByHour: { hour: number; count: number }[];
  sessionsPerGuest: {
    oneSession: number;
    twoSessions: number;
    threePlusSessions: number;
  };
}

export interface GuestAnalyticsResponse {
  newGuests: number;
  returningGuests: number;
  topGuestsByBookingCount: { customerId: string; name: string; phoneNumber: string; bookingCount: number }[];
  channelMix: { whatsapp: number; sms: number; web: number };
}
