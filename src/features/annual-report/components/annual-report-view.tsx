'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Trophy,
  Sunrise,
  Moon,
  BarChart3,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  useAnnualReport,
  useAnnualReportStatus,
  useAnnualReportHistory,
  useShareReport,
} from '../hooks/use-annual-report';
import type {
  AnnualReport,
  ReadingOverview,
  Highlights,
  SocialRanking,
  Preferences,
  Personalization,
  HighlightMoment,
} from '../types';

// ─── Page Components ────────────────────────────────────────

function CoverPage({ report, year }: { report: AnnualReport; year: number }) {
  const t = useTranslations('annualReport');
  const topPercentile = Math.max(
    report.socialRanking.readingTimePercentile,
    report.socialRanking.booksReadPercentile,
    report.socialRanking.vocabularyPercentile,
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-6">
      <p className="text-7xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 bg-clip-text text-transparent">
        {year}
      </p>
      <p className="mt-6 text-xl font-semibold">{t('yearInReading')}</p>
      <p className="mt-2 text-muted-foreground">{report.personalization.title}</p>

      <div className="mt-10 flex gap-8">
        {[
          { value: report.readingOverview.finishedBooks, label: t('books') },
          { value: Math.floor(report.readingOverview.totalReadingMinutes / 60), label: t('hours') },
          { value: `${topPercentile}%`, label: t('top') },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-xs text-muted-foreground animate-pulse">{t('swipeToExplore')}</p>
    </div>
  );
}

function OverviewPage({ overview }: { overview: ReadingOverview }) {
  const t = useTranslations('annualReport');
  const hours = Math.floor(overview.totalReadingMinutes / 60);
  const mins = overview.totalReadingMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const stats = [
    { icon: BookOpen, value: overview.totalBooks, label: t('booksStarted'), color: 'text-blue-500 bg-blue-500/10' },
    { icon: CheckCircle, value: overview.finishedBooks, label: t('booksFinished'), color: 'text-green-500 bg-green-500/10' },
    { icon: Clock, value: timeStr, label: t('totalReadingTime'), color: 'text-orange-500 bg-orange-500/10' },
    { icon: FileText, value: overview.totalPages, label: t('pagesRead'), color: 'text-purple-500 bg-purple-500/10' },
  ];

  return (
    <div className="flex flex-col items-center px-6 py-8">
      <BookOpen className="h-10 w-10 text-blue-500" />
      <p className="mt-3 text-xl font-semibold">{t('readingOverview')}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2 rounded-xl bg-muted/50 p-4">
            <s.icon className={cn('h-6 w-6', s.color.split(' ')[0])} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground text-center">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Completion ring */}
      <div className="mt-8 flex flex-col items-center">
        <p className="text-sm font-medium">{t('completionRate')}</p>
        <div className="relative mt-3 h-32 w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
            <circle
              cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${overview.completionRate * 2.64} 264`}
              className="text-blue-500"
              stroke="url(#gradient)"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{overview.completionRate}%</p>
            <p className="text-[10px] text-muted-foreground">{overview.finishedBooks}/{overview.totalBooks}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightsPage({ highlights }: { highlights: Highlights }) {
  const t = useTranslations('annualReport');

  const items: { key: string; moment: HighlightMoment; icon: typeof Clock; color: string }[] = [];
  if (highlights.longestReadingDay) items.push({ key: 'longestDay', moment: highlights.longestReadingDay, icon: Clock, color: 'text-orange-500' });
  if (highlights.latestReadingNight) items.push({ key: 'latestNight', moment: highlights.latestReadingNight, icon: Moon, color: 'text-indigo-500' });
  if (highlights.mostNotesDay) items.push({ key: 'mostNotes', moment: highlights.mostNotesDay, icon: FileText, color: 'text-green-500' });
  if (highlights.mostCommentsDay) items.push({ key: 'mostComments', moment: highlights.mostCommentsDay, icon: Heart, color: 'text-pink-500' });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col items-center px-6 py-8">
      <Sparkles className="h-10 w-10 text-yellow-500" />
      <p className="mt-3 text-xl font-semibold">{t('highlights')}</p>

      <div className="mt-6 w-full max-w-sm space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
            <item.icon className={cn('h-6 w-6 shrink-0', item.color)} />
            <div className="flex-1">
              <p className="text-sm font-medium">{t(`highlight.${item.key}`)}</p>
              <p className="text-xs text-muted-foreground">
                {item.moment.date} &middot; {item.moment.value}{item.key === 'longestDay' ? ' min' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingPage({ ranking }: { ranking: SocialRanking }) {
  const t = useTranslations('annualReport');

  const items = [
    { label: t('ranking.readingTime'), value: ranking.readingTimePercentile },
    { label: t('ranking.booksRead'), value: ranking.booksReadPercentile },
    { label: t('ranking.vocabulary'), value: ranking.vocabularyPercentile },
  ];

  return (
    <div className="flex flex-col items-center px-6 py-8">
      <Trophy className="h-10 w-10 text-yellow-500" />
      <p className="mt-3 text-xl font-semibold">{t('socialRanking')}</p>

      <div className="mt-6 w-full max-w-sm space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{item.label}</span>
              <span className="font-bold text-primary">{t('topPercent', { value: item.value })}</span>
            </div>
            <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreferencesPage({ preferences }: { preferences: Preferences }) {
  const t = useTranslations('annualReport');

  const prefIcon = {
    EARLY_BIRD: Sunrise,
    NIGHT_OWL: Moon,
    FLEXIBLE: Clock,
    BALANCED: BarChart3,
  }[preferences.readingTimePreference] || Clock;
  const PrefIcon = prefIcon;

  return (
    <div className="flex flex-col items-center px-6 py-8">
      <BarChart3 className="h-10 w-10 text-teal-500" />
      <p className="mt-3 text-xl font-semibold">{t('yourPreferences')}</p>

      <div className="mt-6 w-full max-w-sm space-y-4">
        {/* Reading time preference */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
          <PrefIcon className="h-6 w-6 text-orange-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t(`pref.${preferences.readingTimePreference.toLowerCase()}`)}</p>
            <p className="text-xs text-muted-foreground">{t('avgSession', { min: preferences.avgSessionMinutes })}</p>
          </div>
        </div>

        {/* Top genres */}
        {preferences.favoriteGenres.length > 0 && (
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">{t('favoriteGenres')}</p>
            <div className="space-y-2">
              {preferences.favoriteGenres.slice(0, 5).map((g) => (
                <div key={g.genre} className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-primary/70 transition-all" style={{ width: `${g.percentage}%`, minWidth: 8 }} />
                  <span className="text-xs text-muted-foreground">{g.genre} ({g.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonalizationPage({ personalization, year }: { personalization: Personalization; year: number }) {
  const t = useTranslations('annualReport');

  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <Heart className="h-10 w-10 text-pink-500" />
      <p className="mt-3 text-xl font-semibold">{t('yourTitle')}</p>
      <p className="mt-2 text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        {personalization.title}
      </p>

      {personalization.badges.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {personalization.badges.map((badge) => (
            <span key={badge} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {badge.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-xs">
        {personalization.summary}
      </p>
    </div>
  );
}

// ─── Main View ──────────────────────────────────────────────

interface AnnualReportViewProps {
  year?: number;
}

export function AnnualReportView({ year: initialYear }: AnnualReportViewProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(initialYear || currentYear);
  const [page, setPage] = useState(0);
  const t = useTranslations('annualReport');

  const { data: report, isLoading, error, refetch } = useAnnualReport(year);
  const { data: history } = useAnnualReportHistory();
  const shareMutation = useShareReport();

  // Poll if generating
  const isGenerating = report?.status === 'GENERATING';
  const { data: statusData } = useAnnualReportStatus(year, isGenerating);

  useEffect(() => {
    if (statusData?.status === 'COMPLETED') {
      refetch();
    }
  }, [statusData, refetch]);

  const handleShare = async () => {
    const result = await shareMutation.mutateAsync(year);
    if (result?.url) {
      await navigator.clipboard.writeText(result.url);
    }
  };

  // Loading
  if (isLoading && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  // Generating
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Sparkles className="h-12 w-12 text-blue-500 animate-pulse" />
        <p className="mt-4 text-lg font-semibold">{t('generating')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t('analyzing')}</p>
        <Loader2 className="mt-4 h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error
  if (error || report?.status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-orange-500" />
        <p className="mt-4 font-medium">{t('errorTitle')}</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('tryAgain')}
        </Button>
      </div>
    );
  }

  // No data
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <BookOpen className="h-12 w-12 opacity-30" />
        <p className="mt-4 font-medium">{t('noDataTitle')}</p>
        <p className="mt-2 text-sm">{t('noDataSubtitle')}</p>
      </div>
    );
  }

  // Build pages
  const pages: React.ReactNode[] = [
    <CoverPage key="cover" report={report} year={year} />,
    <OverviewPage key="overview" overview={report.readingOverview} />,
  ];

  const hasHighlights = report.highlights.longestReadingDay ||
    report.highlights.latestReadingNight ||
    report.highlights.mostNotesDay ||
    report.highlights.mostCommentsDay;

  if (hasHighlights) {
    pages.push(<HighlightsPage key="highlights" highlights={report.highlights} />);
  }

  pages.push(
    <RankingPage key="ranking" ranking={report.socialRanking} />,
    <PreferencesPage key="prefs" preferences={report.preferences} />,
    <PersonalizationPage key="personal" personalization={report.personalization} year={year} />,
  );

  return (
    <div className="relative">
      {/* Year selector + share */}
      <div className="flex items-center justify-between mb-4">
        {history && history.years.length > 1 ? (
          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setPage(0); }}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm"
          >
            {history.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm font-medium">{year}</span>
        )}

        {report.status === 'COMPLETED' && (
          <Button variant="outline" size="sm" onClick={handleShare} disabled={shareMutation.isPending}>
            <Share2 className="mr-1.5 h-4 w-4" />
            {t('share')}
          </Button>
        )}
      </div>

      {/* Page content */}
      <div className="rounded-2xl border bg-gradient-to-br from-blue-500/5 to-purple-500/5 overflow-hidden">
        {pages[page]}
      </div>

      {/* Page navigation */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <Button
          variant="ghost" size="icon"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === page ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30',
              )}
            />
          ))}
        </div>

        <Button
          variant="ghost" size="icon"
          disabled={page === pages.length - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
