export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  status: 'SENT' | 'OPENED';
  createdAt: string;
  openedAt?: string;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
