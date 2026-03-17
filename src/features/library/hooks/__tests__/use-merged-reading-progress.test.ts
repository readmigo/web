import { renderHook } from '@testing-library/react';
import { useMergedReadingProgress } from '../use-merged-reading-progress';
import * as useUserLibraryModule from '../use-user-library';
import { useReaderStore } from '@/features/reader/stores/reader-store';
import type { UserBook } from '../../types';

// Vitest globals (vi, describe, it, expect, beforeEach) are injected at runtime
// via vitest.config.ts globals: true — no import needed.

vi.mock('../use-user-library', () => ({
  useContinueReading: vi.fn(),
}));

vi.mock('@/features/reader/stores/reader-store', () => ({
  useReaderStore: vi.fn(),
}));

// Minimal UserBook factory
function makeUserBook(overrides: Partial<UserBook> = {}): UserBook {
  return {
    id: 'ub-1',
    bookId: 'book-1',
    book: {
      id: 'book-1',
      title: 'Test Book',
      author: 'Author',
      coverUrl: 'https://example.com/cover.jpg',
      description: '',
      language: 'en',
      category: 'fiction',
      wordCount: 80000,
    },
    addedAt: new Date('2026-01-01'),
    lastReadAt: new Date('2026-03-01T10:00:00Z'),
    progress: 40,
    status: 'reading',
    ...overrides,
  };
}

describe('useMergedReadingProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isLoading=true while cloud data is loading', () => {
    vi.mocked(useUserLibraryModule.useContinueReading).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useUserLibraryModule.useContinueReading>);

    vi.mocked(useReaderStore).mockReturnValue({} as any);

    const { result } = renderHook(() => useMergedReadingProgress());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns cloud data as-is when no local stats exist for the book', () => {
    const userBook = makeUserBook();

    vi.mocked(useUserLibraryModule.useContinueReading).mockReturnValue({
      data: [userBook],
      isLoading: false,
    } as unknown as ReturnType<typeof useUserLibraryModule.useContinueReading>);

    vi.mocked(useReaderStore).mockReturnValue({} as any);

    const { result } = renderHook(() => useMergedReadingProgress());
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].progress).toBe(40);
  });

  it('uses local progress when local lastReadAt is more recent than cloud', () => {
    const cloudLastReadAt = new Date('2026-03-01T10:00:00Z');
    const localLastReadAt = new Date('2026-03-01T12:00:00Z').getTime(); // 2 hours later

    const userBook = makeUserBook({ lastReadAt: cloudLastReadAt, progress: 40 });

    vi.mocked(useUserLibraryModule.useContinueReading).mockReturnValue({
      data: [userBook],
      isLoading: false,
    } as unknown as ReturnType<typeof useUserLibraryModule.useContinueReading>);

    vi.mocked(useReaderStore).mockReturnValue({
      'book-1': {
        bookId: 'book-1',
        lastReadAt: localLastReadAt,
        lastPosition: { chapterIndex: 5, page: 3, percentage: 72 },
        totalReadingTime: 3600,
        totalWordsRead: 5000,
        sessionsCount: 3,
        averageWpm: 200,
      },
    } as any);

    const { result } = renderHook(() => useMergedReadingProgress());
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].progress).toBe(72);
    expect(result.current.data![0].lastReadAt?.getTime()).toBe(localLastReadAt);
  });

  it('keeps cloud progress when cloud lastReadAt is more recent than local', () => {
    const cloudLastReadAt = new Date('2026-03-15T18:00:00Z');
    const localLastReadAt = new Date('2026-03-14T10:00:00Z').getTime(); // 1 day earlier

    const userBook = makeUserBook({ lastReadAt: cloudLastReadAt, progress: 80 });

    vi.mocked(useUserLibraryModule.useContinueReading).mockReturnValue({
      data: [userBook],
      isLoading: false,
    } as unknown as ReturnType<typeof useUserLibraryModule.useContinueReading>);

    vi.mocked(useReaderStore).mockReturnValue({
      'book-1': {
        bookId: 'book-1',
        lastReadAt: localLastReadAt,
        lastPosition: { chapterIndex: 3, page: 1, percentage: 55 },
        totalReadingTime: 1800,
        totalWordsRead: 2000,
        sessionsCount: 2,
        averageWpm: 190,
      },
    } as any);

    const { result } = renderHook(() => useMergedReadingProgress());
    expect(result.current.data![0].progress).toBe(80);
  });

  it('sorts result by lastReadAt descending', () => {
    const bookA = makeUserBook({
      id: 'ub-1',
      bookId: 'book-a',
      lastReadAt: new Date('2026-03-10T08:00:00Z'),
      progress: 20,
      book: { id: 'book-a', title: 'A', author: 'X', coverUrl: '', description: '', language: 'en', category: 'c', wordCount: 0 },
    });
    const bookB = makeUserBook({
      id: 'ub-2',
      bookId: 'book-b',
      lastReadAt: new Date('2026-03-16T08:00:00Z'),
      progress: 60,
      book: { id: 'book-b', title: 'B', author: 'X', coverUrl: '', description: '', language: 'en', category: 'c', wordCount: 0 },
    });

    vi.mocked(useUserLibraryModule.useContinueReading).mockReturnValue({
      data: [bookA, bookB],
      isLoading: false,
    } as unknown as ReturnType<typeof useUserLibraryModule.useContinueReading>);

    vi.mocked(useReaderStore).mockReturnValue({} as any);

    const { result } = renderHook(() => useMergedReadingProgress());
    expect(result.current.data![0].bookId).toBe('book-b');
    expect(result.current.data![1].bookId).toBe('book-a');
  });

  it('returns empty array when cloud returns empty list', () => {
    vi.mocked(useUserLibraryModule.useContinueReading).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useUserLibraryModule.useContinueReading>);

    vi.mocked(useReaderStore).mockReturnValue({} as any);

    const { result } = renderHook(() => useMergedReadingProgress());
    expect(result.current.data).toEqual([]);
  });
});
