export interface TodayStats {
  readingSeconds: number;
  ttsSeconds: number;
  audiobookSeconds: number;
  totalSeconds: number;
  pagesRead: number;
  sessionCount: number;
}

export interface DailyBreakdown {
  date: string;
  readingSeconds: number;
  ttsSeconds: number;
  audiobookSeconds: number;
  totalSeconds: number;
}

export interface WeeklyStats {
  days: DailyBreakdown[];
  totalSeconds: number;
  readingSeconds: number;
  ttsSeconds: number;
  audiobookSeconds: number;
  activeDays: number;
  averagePerDay: number;
  sessionCount: number;
}

export interface MonthlyStats {
  totalSeconds: number;
  readingSeconds: number;
  ttsSeconds: number;
  audiobookSeconds: number;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
}

export interface ReadingStatsResponse {
  today: TodayStats;
  weekly: WeeklyStats;
  monthly: MonthlyStats;
}

// --- Analytics types (migrated from features/analytics) ---

export interface OverviewStats {
  totalReadingMinutes: number;
  booksFinished: number;
  currentStreak: number;
  longestStreak: number;
  avgDailyMinutes: number;
  todayMinutes: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
}

export interface DailyStats {
  date: string;
  minutes: number;
  wordsRead: number;
  pagesRead: number;
}

export type TrendDirection = 'up' | 'down' | 'stable';

export interface ReadingTrend {
  dailyStats: DailyStats[];
  totalMinutes: number;
  avgMinutesPerDay: number;
  daysActive: number;
  totalDays: number;
  trend: TrendDirection;
  percentChange?: number;
}

export interface BookProgress {
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string;
  progress: number;
  lastReadAt: string;
}

export interface RecentSession {
  bookId: string;
  bookTitle: string;
  durationSeconds: number;
  wordsRead: number;
  readAt: string;
}

export interface ReadingProgress {
  currentlyReading: BookProgress[];
  recentSessions: RecentSession[];
  booksInProgress: number;
  booksFinished: number;
  booksInLibrary: number;
}
