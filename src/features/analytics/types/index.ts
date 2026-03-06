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
  durationMinutes: number;
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
