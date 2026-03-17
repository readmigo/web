'use client';

import { useState } from 'react';
import { BookOpen, Volume2, Headphones, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { formatDuration } from '../utils/format-duration';
import type { DailyBreakdown } from '../types';

interface DailyRowProps {
  day: DailyBreakdown;
}

function DailyRow({ day }: DailyRowProps) {
  const t = useTranslations('analytics');

  const date = new Date(day.date);
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const weekDay = date.toLocaleDateString(undefined, { weekday: 'short' });
  const isEmpty = day.totalSeconds === 0;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      {/* Date label */}
      <div className="w-14 shrink-0 text-right">
        <p className="text-xs font-medium text-foreground">{monthDay}</p>
        <p className="text-[10px] text-muted-foreground">{weekDay}</p>
      </div>

      {/* Type breakdowns */}
      {isEmpty ? (
        <p className="flex-1 text-xs text-muted-foreground">{t('noActivity')}</p>
      ) : (
        <div className="flex-1 space-y-1">
          {day.readingSeconds > 0 && (
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 shrink-0 text-blue-500" />
              <div className="h-1.5 rounded-full bg-blue-500/20 flex-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${Math.round((day.readingSeconds / day.totalSeconds) * 100)}%` }}
                />
              </div>
              <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
                {formatDuration(day.readingSeconds)}
              </span>
            </div>
          )}
          {day.ttsSeconds > 0 && (
            <div className="flex items-center gap-1.5">
              <Volume2 className="h-3 w-3 shrink-0 text-violet-500" />
              <div className="h-1.5 rounded-full bg-violet-500/20 flex-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${Math.round((day.ttsSeconds / day.totalSeconds) * 100)}%` }}
                />
              </div>
              <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
                {formatDuration(day.ttsSeconds)}
              </span>
            </div>
          )}
          {day.audiobookSeconds > 0 && (
            <div className="flex items-center gap-1.5">
              <Headphones className="h-3 w-3 shrink-0 text-amber-500" />
              <div className="h-1.5 rounded-full bg-amber-500/20 flex-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${Math.round((day.audiobookSeconds / day.totalSeconds) * 100)}%` }}
                />
              </div>
              <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
                {formatDuration(day.audiobookSeconds)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Daily total */}
      <div className="w-12 shrink-0 text-right">
        <span className="text-xs font-semibold tabular-nums">
          {isEmpty ? '—' : formatDuration(day.totalSeconds)}
        </span>
      </div>
    </div>
  );
}

interface DailyStatsSectionProps {
  days: DailyBreakdown[];
}

const INITIAL_VISIBLE = 3;

export function DailyStatsSection({ days }: DailyStatsSectionProps) {
  const t = useTranslations('analytics');
  const [expanded, setExpanded] = useState(false);

  // Show most recent days first
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
  const visible = expanded ? sorted : sorted.slice(0, INITIAL_VISIBLE);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">📅</span>
          {t('dailyDetails')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {/* Legend */}
        <div className="mb-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-blue-500" />
            {t('reading')}
          </span>
          <span className="flex items-center gap-1">
            <Volume2 className="h-3 w-3 text-violet-500" />
            {t('tts')}
          </span>
          <span className="flex items-center gap-1">
            <Headphones className="h-3 w-3 text-amber-500" />
            {t('audiobook')}
          </span>
        </div>

        {/* Rows */}
        <div>
          {visible.map((day) => (
            <DailyRow key={day.date} day={day} />
          ))}
        </div>

        {/* Expand / collapse toggle */}
        {sorted.length > INITIAL_VISIBLE && (
          <button
            className="mt-2 flex w-full items-center justify-center gap-1 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                {t('showLess')}
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                {t('showAll', { count: sorted.length })}
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
