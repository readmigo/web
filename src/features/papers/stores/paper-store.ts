import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SortOption, ViewMode } from '../types';

interface PaperState {
  viewMode: ViewMode;
  sortBy: SortOption;
  searchQuery: string;
  currentPaperId: string | null;
  currentPage: number;
  scale: number;
  showSidebar: boolean;
  sidebarTab: 'highlights' | 'annotations';
}

interface PaperActions {
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortOption) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPaper: (paperId: string | null) => void;
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: 'highlights' | 'annotations') => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

export const usePaperStore = create<PaperState & PaperActions>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      sortBy: 'recent',
      searchQuery: '',
      currentPaperId: null,
      currentPage: 1,
      scale: 1,
      showSidebar: false,
      sidebarTab: 'highlights',

      setViewMode: (viewMode) => set({ viewMode }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setCurrentPaper: (currentPaperId) => set({ currentPaperId, currentPage: 1 }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setScale: (scale) => set({ scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) }),
      zoomIn: () =>
        set((state) => ({
          scale: Math.min(MAX_SCALE, state.scale + SCALE_STEP),
        })),
      zoomOut: () =>
        set((state) => ({
          scale: Math.max(MIN_SCALE, state.scale - SCALE_STEP),
        })),
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
    }),
    {
      name: 'paper-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        scale: state.scale,
      }),
    }
  )
);
