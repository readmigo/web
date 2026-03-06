'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useThreadMessages, useReplyToTicket } from '../hooks/use-messages';

interface MessageThreadProps {
  ticketId: string;
  onBack: () => void;
}

export function MessageThread({ ticketId, onBack }: MessageThreadProps) {
  const t = useTranslations('messaging');
  const [input, setInput] = useState('');
  const { data: messages, isLoading } = useThreadMessages(ticketId);
  const reply = useReplyToTicket();

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    reply.mutate({ ticketId, content });
    setInput('');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-2 py-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium text-sm">{t('thread')}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className={cn('h-12 rounded-xl', i % 2 === 0 ? 'w-3/4' : 'w-2/3 ml-auto')} />
          ))
        ) : (
          messages?.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2.5',
                msg.senderType === 'USER'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted',
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={cn(
                'mt-1 text-[10px]',
                msg.senderType === 'USER' ? 'text-primary-foreground/60' : 'text-muted-foreground',
              )}>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t px-4 py-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('inputPlaceholder')}
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || reply.isPending}
        >
          {reply.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
