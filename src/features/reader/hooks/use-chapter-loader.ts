import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChapterRenderer } from '../engine/chapter-renderer';
import { Paginator } from '../engine/paginator';
import { THEMES, DEFAULT_THEME_MAPPING } from '../engine/types';
import type { ReaderSettings as EngineSettings } from '../engine/types';
import { watchSystemAppearance, resolveTheme } from '../engine/appearance';
import { useReaderStore } from '../stores/reader-store';
import type { TocItem } from '../types';
import type { Chapter } from '@/features/library/types';
import { apiClient } from '@/lib/api/client';
import { log } from '@/lib/logger';

interface ChapterContentResponse {
  id: string;
  title: string;
  order: number;
  contentUrl: string;
  wordCount?: number;
  previousChapterId?: string | null;
  nextChapterId?: string | null;
}

/** Maps web settings to reader-engine settings. */
function mapSettings(
  s: ReturnType<typeof useReaderStore.getState>['settings'],
  systemIsDark: boolean,
): EngineSettings {
  const marginMap = { small: 20, medium: 40, large: 60 } as const;
  const fontMap: Record<string, string> = {
    'system-ui': 'system-ui, -apple-system, sans-serif',
    'Inter': '"Inter", system-ui, sans-serif',
    'Helvetica Neue': '"Helvetica Neue", Helvetica, Arial, sans-serif',
    'Georgia': 'Georgia, serif',
    'Times New Roman': '"Times New Roman", Times, serif',
    'Palatino': 'Palatino, "Palatino Linotype", serif',
    'JetBrains Mono': '"JetBrains Mono", "Courier New", monospace',
    'Consolas': 'Consolas, "Courier New", monospace',
    'Courier New': '"Courier New", Courier, monospace',
    'OpenDyslexic': 'OpenDyslexic, sans-serif',
    'Noto Serif SC': '"Noto Serif SC", Georgia, serif',
    'LXGW WenKai': '"LXGW WenKai", Georgia, serif',
  };
  const resolvedTheme = resolveTheme(s.appearanceMode ?? 'auto', DEFAULT_THEME_MAPPING, systemIsDark) ?? 'light';
  return {
    fontSize: s.fontSize,
    fontFamily: fontMap[s.fontFamily] ?? 'Georgia, serif',
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    wordSpacing: s.wordSpacing,
    paragraphSpacing: s.paragraphSpacing,
    textAlign: s.textAlign,
    hyphenation: s.hyphenation,
    theme: resolvedTheme,
    margin: marginMap[s.marginSize] || 40,
    columnCount: s.columnCount,
    textIndent: s.textIndent,
    fontWeight: s.fontWeight,
  };
}

export interface ChapterLoaderResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rendererRef: React.RefObject<ChapterRenderer | null>;
  paginatorRef: React.RefObject<Paginator | null>;
  currentIndexRef: React.RefObject<number>;
  isLoading: boolean;
  error: string | null;
  /** Resolved theme colors for background rendering. */
  themeColors: { background: string; text: string };
  loadChapter: (index: number, goToLastPage?: boolean) => Promise<void>;
  emitPosition: (chapterIdx: number, page: number, totalPages: number) => void;
}

/**
 * Manages the reader engine lifecycle: renderer creation, chapter fetching,
 * pagination setup, settings sync, resize handling, and system appearance.
 *
 * @param setupInteractions - callback to wire interactions after chapter loads
 * @param cleanupInteractionsRef - ref holding the latest interaction teardown fn
 * @param onClearCaches - called on full unmount to dispose caches
 */
export function useChapterLoader(
  bookId: string,
  chapters: Chapter[],
  initialChapterIndex: number | undefined,
  setupInteractions: (contentEl: HTMLElement, chapterOrder: number) => (() => void),
  cleanupInteractionsRef: React.MutableRefObject<(() => void) | null>,
  onClearCaches: () => void,
  onReady?: () => void,
  onTocLoaded?: (toc: TocItem[]) => void,
): ChapterLoaderResult {
  const t = useTranslations('reader');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<ChapterRenderer | null>(null);
  const paginatorRef = useRef<Paginator | null>(null);
  const currentIndexRef = useRef<number>(initialChapterIndex ?? 0);
  const loadingChapterRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { settings, position, systemIsDark, setPosition, setSystemIsDark } = useReaderStore();

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const systemIsDarkRef = useRef(systemIsDark);
  useEffect(() => { systemIsDarkRef.current = systemIsDark; }, [systemIsDark]);

  const onReadyRef = useRef(onReady);
  const onTocLoadedRef = useRef(onTocLoaded);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onTocLoadedRef.current = onTocLoaded; }, [onTocLoaded]);

  // Watch system appearance for auto mode
  useEffect(() => {
    const { isDark, cleanup } = watchSystemAppearance((dark: boolean) => {
      setSystemIsDark(dark);
    });
    setSystemIsDark(isDark);
    return cleanup;
  }, [setSystemIsDark]);

  // --- Chapter fetching ---

  const fetchChapterHtml = useCallback(async (chapterId: string): Promise<string> => {
    const res = await apiClient.get<ChapterContentResponse>(
      `/books/${bookId}/content/${chapterId}`,
      { skipAuth: true },
    );
    const contentUrl = res.contentUrl;
    const htmlRes = await fetch(contentUrl);
    if (!htmlRes.ok) throw new Error(`Failed to fetch chapter HTML: ${htmlRes.status}`);
    return htmlRes.text();
  }, [bookId]);

  // --- Position emission ---

  const emitPosition = useCallback((chapterIdx: number, page: number, totalPages: number) => {
    const totalChapters = chapters.length || 1;
    const chapterProgress = totalPages > 1 ? page / (totalPages - 1) : 1;
    const overallProgress = (chapterIdx + chapterProgress) / totalChapters;
    setPosition({
      chapterIndex: chapterIdx,
      page,
      percentage: Math.min(1, overallProgress),
    });
  }, [chapters.length, setPosition]);

  // --- Load chapter ---

  const loadChapter = useCallback(async (index: number, goToLastPage = false) => {
    if (!containerRef.current || !chapters.length || loadingChapterRef.current) return;
    if (index < 0 || index >= chapters.length) return;

    loadingChapterRef.current = true;
    setIsLoading(true);

    try {
      const chapter = chapters[index];
      const html = await fetchChapterHtml(chapter.id);

      // Clean up previous interaction listeners
      cleanupInteractionsRef.current?.();
      cleanupInteractionsRef.current = null;

      // Create/reuse renderer
      const engineSettings = mapSettings(settingsRef.current, systemIsDarkRef.current);
      if (!rendererRef.current) {
        rendererRef.current = new ChapterRenderer(containerRef.current, engineSettings);
      } else {
        rendererRef.current.updateSettings(engineSettings);
      }

      // ChapterRenderer.render() internally sanitizes HTML via DOMPurify
      rendererRef.current.render(html);

      // Set up paginator
      const viewport = rendererRef.current.viewportElement;
      const content = rendererRef.current.contentElement;
      if (viewport && content) {
        paginatorRef.current = new Paginator(viewport, content, {
          margin: engineSettings.margin,
          gap: engineSettings.margin * 2,
        });

        if (goToLastPage) {
          paginatorRef.current.goToEnd();
        }

        paginatorRef.current.onPageChange = (state) => {
          emitPosition(index, state.currentPage, state.totalPages);
        };

        currentIndexRef.current = index;
        emitPosition(index, paginatorRef.current.currentPage, paginatorRef.current.totalPages);
      }

      // Set up interactions (translation, selection, gestures)
      if (content) {
        cleanupInteractionsRef.current = setupInteractions(content, chapter.order);
      }

      setIsLoading(false);
      setError(null);
    } catch (err) {
      log.reader.error('Failed to load chapter', err);
      setError(t('chapterLoadError'));
      setIsLoading(false);
    } finally {
      loadingChapterRef.current = false;
    }
  }, [chapters, fetchChapterHtml, emitPosition, setupInteractions, cleanupInteractionsRef, t]);

  // --- Initialize: load first chapter and emit TOC ---

  useEffect(() => {
    if (!chapters.length) return;

    const tocItems: TocItem[] = chapters.map((ch) => ({
      id: ch.id,
      href: ch.id,
      label: ch.title,
    }));
    onTocLoadedRef.current?.(tocItems);

    const lastPos = position;
    const startIndex = lastPos?.chapterIndex ?? initialChapterIndex ?? 0;
    const validIndex = Math.min(startIndex, chapters.length - 1);
    void loadChapter(validIndex).then(() => {
      onReadyRef.current?.();
    });

    return () => {
      cleanupInteractionsRef.current?.();
      cleanupInteractionsRef.current = null;
      rendererRef.current?.clear();
      rendererRef.current = null;
      paginatorRef.current = null;
      onClearCaches();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapters]);

  // --- Update settings when changed ---

  useEffect(() => {
    if (!rendererRef.current) return;
    const engineSettings = mapSettings(settings, systemIsDark);
    rendererRef.current.updateSettings(engineSettings);
    if (paginatorRef.current) {
      paginatorRef.current.recalculate();
      emitPosition(
        currentIndexRef.current,
        paginatorRef.current.currentPage,
        paginatorRef.current.totalPages,
      );
    }
  }, [settings, systemIsDark, emitPosition]);

  // --- Handle resize ---

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (paginatorRef.current) {
        paginatorRef.current.recalculate();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // --- Theme colors ---

  const resolvedThemeName = resolveTheme(settings.appearanceMode, DEFAULT_THEME_MAPPING, systemIsDark);
  const themeColors = THEMES[resolvedThemeName] || THEMES.light;

  return {
    containerRef,
    rendererRef,
    paginatorRef,
    currentIndexRef,
    isLoading,
    error,
    themeColors,
    loadChapter,
    emitPosition,
  };
}
