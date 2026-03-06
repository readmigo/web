export type ReportStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export type ReadingTimePreference = 'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE' | 'BALANCED';

export type PreferredReadingDays = 'WEEKEND' | 'WEEKDAY' | 'BALANCED';

export interface AnnualReportBookDetail {
  id: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string;
  progressPercent: number;
  status: string;
  finishedAt?: string;
  readingMinutes: number;
}

export interface ReadingOverview {
  totalBooks: number;
  finishedBooks: number;
  totalReadingMinutes: number;
  totalPages: number;
  completionRate: number;
  booksDetail: AnnualReportBookDetail[];
}

export interface HighlightMoment {
  date: string;
  value: number;
  context?: string;
}

export interface FirstSubscription {
  date: string;
  planType: string;
}

export interface Highlights {
  longestReadingDay?: HighlightMoment;
  latestReadingNight?: HighlightMoment;
  mostNotesDay?: HighlightMoment;
  mostCommentsDay?: HighlightMoment;
  mostAgoraPostsDay?: HighlightMoment;
  mostFeedbackDay?: HighlightMoment;
  firstSubscriptionDay?: FirstSubscription;
}

export interface SocialRanking {
  readingTimePercentile: number;
  booksReadPercentile: number;
  vocabularyPercentile: number;
}

export interface GenrePreference {
  genre: string;
  count: number;
  percentage: number;
}

export interface AIUsagePreference {
  type: string;
  count: number;
  percentage: number;
}

export interface Preferences {
  readingTimePreference: string;
  preferredReadingDays: string;
  avgSessionMinutes: number;
  favoriteGenres: GenrePreference[];
  aiUsagePreference: AIUsagePreference[];
}

export interface Personalization {
  badges: string[];
  title: string;
  summary: string;
  summaryLocalized?: Record<string, string>;
}

export interface AnnualReport {
  id: string;
  year: number;
  status: ReportStatus;
  generatedAt?: string;
  readingOverview: ReadingOverview;
  highlights: Highlights;
  socialRanking: SocialRanking;
  preferences: Preferences;
  personalization: Personalization;
  shareCardUrl?: string;
}

export interface AnnualReportStatusResponse {
  status: ReportStatus;
  generatedAt?: string;
  progress?: number;
}

export interface AnnualReportHistoryResponse {
  years: number[];
  currentYear: number;
}

export interface SharePageResponse {
  url: string;
  shareId: string;
}
