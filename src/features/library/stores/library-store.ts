import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SortOption, FilterOption, ViewMode } from '../types';

interface LibraryState {
  viewMode: ViewMode;
  sortBy: SortOption;
  filterBy: FilterOption;
  searchQuery: string;
  currentBookId: string | null;
}

interface LibraryActions {
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortOption) => void;
  setFilterBy: (filter: FilterOption) => void;
  setSearchQuery: (query: string) => void;
  setCurrentBook: (bookId: string | null) => void;
}

export const useLibraryStore = create<LibraryState & LibraryActions>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      sortBy: 'recent',
      filterBy: 'all',
      searchQuery: '',
      currentBookId: null,

      setViewMode: (viewMode) => set({ viewMode }),
      setSortBy: (sortBy) => set({ sortBy }),
      setFilterBy: (filterBy) => set({ filterBy }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setCurrentBook: (currentBookId) => set({ currentBookId }),
    }),
    {
      name: 'library-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
      }),
    }
  )
);
