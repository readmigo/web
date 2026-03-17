'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import type { RecentSession } from '../types';

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface RecentSessionsProps {
  sessions: RecentSession[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  const t = useTranslations('analytics');

  if (sessions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('recentSessions')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.slice(0, 5).map((session, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="truncate flex-1">{session.bookTitle}</span>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {formatMinutes(Math.round(session.durationSeconds / 60))}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
