export type ThreadStatus = 'NEW' | 'IN_PROGRESS' | 'AWAITING_USER' | 'RESOLVED' | 'CLOSED';

export type SenderType = 'USER' | 'AGENT' | 'SYSTEM';

export interface MessageThread {
  id: string;
  subject: string;
  category: string;
  status: ThreadStatus;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  senderType: SenderType;
  content: string;
  createdAt: string;
}

export interface ThreadsResponse {
  data: MessageThread[];
  total: number;
  page: number;
  hasMore: boolean;
}
