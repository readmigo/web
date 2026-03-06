'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTickets } from '../hooks/use-messages';
import { MessageThread } from './message-thread';
import type { ThreadStatus, MessageThread as ThreadType } from '../types';

const STATUS_CONFIG: Record<ThreadStatus, { color: string; icon: typeof Clock }> = {
  NEW: { color: 'bg-blue-500', icon: AlertCircle },
  IN_PROGRESS: { color: 'bg-yellow-500', icon: Clock },
  AWAITING_USER: { color: 'bg-orange-500', icon: AlertCircle },
  RESOLVED: { color: 'bg-green-500', icon: CheckCircle },
  CLOSED: { color: 'bg-muted-foreground', icon: CheckCircle },
};

export function MessageList() {
  const t = useTranslations('messaging');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const { data, isLoading } = useTickets();

  if (selectedTicket) {
    return (
      <MessageThread
        ticketId={selectedTicket}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const tickets = data?.data || [];

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <MessageSquare className="h-12 w-12 opacity-30" />
        <p className="mt-3 text-sm">{t('empty')}</p>
        <Button className="mt-4" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          {t('newTicket')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => {
        const status = STATUS_CONFIG[ticket.status];
        return (
          <button
            key={ticket.id}
            className="flex w-full items-start gap-3 rounded-xl border p-3 text-left hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedTicket(ticket.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{ticket.subject}</p>
                {ticket.unreadCount > 0 && (
                  <Badge className="h-5 min-w-[20px] justify-center rounded-full bg-primary text-[10px]">
                    {ticket.unreadCount}
                  </Badge>
                )}
              </div>
              {ticket.lastMessage && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                  {ticket.lastMessage}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-2">
                <div className={cn('h-1.5 w-1.5 rounded-full', status.color)} />
                <span className="text-[10px] text-muted-foreground">{ticket.status}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
