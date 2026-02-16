// Audiobook source
export type AudiobookSource = 'LIBRIVOX' | 'INTERNET_ARCHIVE' | 'USER_UPLOAD' | 'PREMIUM';

// Audio quality
export type AudioQuality = 'LOW' | 'STANDARD' | 'HIGH';

// Listening status
export type ListeningStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

// Playback speed options
export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0 | 2.5 | 3.0;

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

// Sleep timer options in minutes
export type SleepTimerOption = 5 | 10 | 15 | 30 | 45 | 60 | 'end_of_chapter';

export const SLEEP_TIMER_OPTIONS: { label: string; value: SleepTimerOption }[] = [
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
  { label: 'End of chapter', value: 'end_of_chapter' },
];

// Audiobook chapter
export interface AudiobookChapter {
  id: string;
  number: number;
  title: string;
  duration: number; // seconds
  audioUrl: string;
  readerName?: string;
  bookChapterId?: string; // Link to ebook chapter for Whispersync
}

// Audiobook
export interface Audiobook {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  coverUrl?: string;
  description?: string;
  totalDuration: number; // seconds
  chapters: AudiobookChapter[];
  source: AudiobookSource;
  language: string;
  bookId?: string; // Associated ebook ID for Whispersync
  createdAt: string;
  updatedAt: string;
}

// Audiobook list item (without chapters)
export interface AudiobookListItem {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  coverUrl?: string;
  totalDuration: number;
  chapterCount: number;
  source?: AudiobookSource;
  language: string;
  bookId?: string;
}

// User's audiobook progress
export interface AudiobookProgress {
  audiobookId: string;
  currentChapter: number;
  currentPosition: number; // seconds within chapter
  totalListened: number; // total seconds listened
  playbackSpeed: PlaybackSpeed;
  status: ListeningStatus;
  lastPlayedAt: string;
}

// Audiobook with progress
export interface AudiobookWithProgress extends Audiobook {
  progress?: AudiobookProgress;
}

// Audio player state
export interface AudioPlayerState {
  // Current audiobook
  audiobook: Audiobook | null;
  currentChapter: AudiobookChapter | null;
  chapterIndex: number;

  // Playback state
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  currentTime: number; // seconds within chapter
  duration: number; // chapter duration
  playbackSpeed: PlaybackSpeed;
  volume: number; // 0-1

  // UI state
  isMinimized: boolean;
  isVisible: boolean;

  // Sleep timer
  sleepTimer: SleepTimerOption | null;
  sleepTimerEndTime: number | null; // timestamp

  // Error
  error: string | null;
}

// Audio player actions
export interface AudioPlayerActions {
  // Playback controls
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  seekForward: (seconds?: number) => void;
  seekBackward: (seconds?: number) => void;

  // Chapter navigation
  nextChapter: () => void;
  previousChapter: () => void;
  goToChapter: (index: number) => void;

  // Settings
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setVolume: (volume: number) => void;

  // Sleep timer
  setSleepTimer: (option: SleepTimerOption | null) => void;
  clearSleepTimer: () => void;

  // Audiobook management
  loadAudiobook: (audiobook: Audiobook, startChapter?: number, startPosition?: number) => void;
  unloadAudiobook: () => void;

  // UI
  minimize: () => void;
  maximize: () => void;
  hide: () => void;
  show: () => void;

  // Progress sync
  syncProgress: () => Promise<void>;
}

// API request/response types
export interface AudiobooksQueryParams {
  page?: number;
  limit?: number;
  bookId?: string;
  hasBookSync?: boolean;
  language?: string;
  search?: string;
  sortBy?: 'title' | 'author' | 'duration' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AudiobooksResponse {
  items: AudiobookListItem[];
  data?: AudiobookListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StartAudiobookRequest {
  chapterIndex?: number;
  positionSeconds?: number;
}

export interface UpdateProgressRequest {
  chapterIndex: number;
  positionSeconds: number;
  playbackSpeed?: PlaybackSpeed;
}
