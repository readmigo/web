import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAudioManager } from '../lib/audio-manager';
import { apiClient } from '@/lib/api/client';
import type {
  Audiobook,
  AudiobookChapter,
  AudioPlayerState,
  AudioPlayerActions,
  PlaybackSpeed,
  SleepTimerOption,
} from '../types';

interface AudioPlayerStore extends AudioPlayerState, AudioPlayerActions {}

// Progress sync debounce
let progressSyncTimeout: ReturnType<typeof setTimeout> | null = null;

export const useAudioPlayerStore = create<AudioPlayerStore>()(
  persist(
    (set, get) => {
      // Initialize audio manager event handlers
      const setupAudioEvents = () => {
        const audioManager = getAudioManager();

        audioManager.on('play', () => {
          set({ isPlaying: true, isLoading: false });
        });

        audioManager.on('pause', () => {
          set({ isPlaying: false });
        });

        audioManager.on('ended', () => {
          const { nextChapter } = get();
          nextChapter();
        });

        audioManager.on('loadstart', () => {
          set({ isLoading: true, isBuffering: false });
        });

        audioManager.on('canplay', () => {
          set({ isLoading: false, isBuffering: false });
        });

        audioManager.on('waiting', () => {
          set({ isBuffering: true });
        });

        audioManager.on('timeupdate', (currentTime, duration) => {
          set({ currentTime, duration });

          // Check sleep timer
          const { sleepTimerEndTime, sleepTimer } = get();
          if (sleepTimerEndTime && Date.now() >= sleepTimerEndTime) {
            get().pause();
            set({ sleepTimer: null, sleepTimerEndTime: null });
          }

          // Debounced progress sync
          if (progressSyncTimeout) {
            clearTimeout(progressSyncTimeout);
          }
          progressSyncTimeout = setTimeout(() => {
            get().syncProgress();
          }, 5000); // Sync every 5 seconds of playback
        });

        audioManager.on('error', (error) => {
          set({ error: error.message, isLoading: false, isPlaying: false });
        });
      };

      // Setup events on store creation
      if (typeof window !== 'undefined') {
        setupAudioEvents();
      }

      return {
        // Initial state
        audiobook: null,
        currentChapter: null,
        chapterIndex: 0,
        isPlaying: false,
        isLoading: false,
        isBuffering: false,
        currentTime: 0,
        duration: 0,
        playbackSpeed: 1.0,
        volume: 1,
        isMinimized: false,
        isVisible: false,
        sleepTimer: null,
        sleepTimerEndTime: null,
        error: null,

        // Playback controls
        play: async () => {
          const audioManager = getAudioManager();
          try {
            await audioManager.play();
          } catch (error) {
            set({ error: (error as Error).message });
          }
        },

        pause: () => {
          const audioManager = getAudioManager();
          audioManager.pause();
        },

        togglePlay: async () => {
          const audioManager = getAudioManager();
          try {
            await audioManager.togglePlay();
          } catch (error) {
            set({ error: (error as Error).message });
          }
        },

        seek: (time: number) => {
          const audioManager = getAudioManager();
          audioManager.seek(time);
          set({ currentTime: time });
        },

        seekForward: (seconds = 15) => {
          const audioManager = getAudioManager();
          audioManager.seekForward(seconds);
        },

        seekBackward: (seconds = 15) => {
          const audioManager = getAudioManager();
          audioManager.seekBackward(seconds);
        },

        // Chapter navigation
        nextChapter: async () => {
          const { audiobook, chapterIndex, playbackSpeed } = get();
          if (!audiobook) return;

          const nextIndex = chapterIndex + 1;
          if (nextIndex >= audiobook.chapters.length) {
            // End of audiobook
            set({ isPlaying: false });
            get().syncProgress();
            return;
          }

          // Check if we should stop at end of chapter (sleep timer)
          const { sleepTimer } = get();
          if (sleepTimer === 'end_of_chapter') {
            set({ sleepTimer: null, sleepTimerEndTime: null, isPlaying: false });
            return;
          }

          const nextChapter = audiobook.chapters[nextIndex];
          set({
            chapterIndex: nextIndex,
            currentChapter: nextChapter,
            currentTime: 0,
            isLoading: true,
          });

          const audioManager = getAudioManager();
          try {
            await audioManager.load(nextChapter.audioUrl);
            audioManager.setPlaybackSpeed(playbackSpeed);
            await audioManager.play();
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        previousChapter: async () => {
          const { audiobook, chapterIndex, playbackSpeed, currentTime } = get();
          if (!audiobook) return;

          // If we're more than 3 seconds into the chapter, restart current chapter
          if (currentTime > 3) {
            get().seek(0);
            return;
          }

          const prevIndex = chapterIndex - 1;
          if (prevIndex < 0) return;

          const prevChapter = audiobook.chapters[prevIndex];
          set({
            chapterIndex: prevIndex,
            currentChapter: prevChapter,
            currentTime: 0,
            isLoading: true,
          });

          const audioManager = getAudioManager();
          try {
            await audioManager.load(prevChapter.audioUrl);
            audioManager.setPlaybackSpeed(playbackSpeed);
            await audioManager.play();
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        goToChapter: async (index: number) => {
          const { audiobook, playbackSpeed, isPlaying } = get();
          if (!audiobook || index < 0 || index >= audiobook.chapters.length) return;

          const chapter = audiobook.chapters[index];
          set({
            chapterIndex: index,
            currentChapter: chapter,
            currentTime: 0,
            isLoading: true,
          });

          const audioManager = getAudioManager();
          try {
            await audioManager.load(chapter.audioUrl);
            audioManager.setPlaybackSpeed(playbackSpeed);
            if (isPlaying) {
              await audioManager.play();
            }
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        // Settings
        setPlaybackSpeed: (speed: PlaybackSpeed) => {
          const audioManager = getAudioManager();
          audioManager.setPlaybackSpeed(speed);
          set({ playbackSpeed: speed });
        },

        setVolume: (volume: number) => {
          const audioManager = getAudioManager();
          audioManager.setVolume(volume);
          set({ volume });
        },

        // Sleep timer
        setSleepTimer: (option: SleepTimerOption | null) => {
          if (option === null) {
            set({ sleepTimer: null, sleepTimerEndTime: null });
            return;
          }

          if (option === 'end_of_chapter') {
            set({ sleepTimer: option, sleepTimerEndTime: null });
          } else {
            const endTime = Date.now() + option * 60 * 1000;
            set({ sleepTimer: option, sleepTimerEndTime: endTime });
          }
        },

        clearSleepTimer: () => {
          set({ sleepTimer: null, sleepTimerEndTime: null });
        },

        // Audiobook management
        loadAudiobook: async (
          audiobook: Audiobook,
          startChapter = 0,
          startPosition = 0
        ) => {
          const { playbackSpeed } = get();
          const chapter = audiobook.chapters[startChapter] || audiobook.chapters[0];

          set({
            audiobook,
            currentChapter: chapter,
            chapterIndex: startChapter,
            currentTime: startPosition,
            duration: chapter.duration,
            isVisible: true,
            isMinimized: false,
            error: null,
            isLoading: true,
          });

          const audioManager = getAudioManager();
          try {
            await audioManager.load(chapter.audioUrl);
            audioManager.setPlaybackSpeed(playbackSpeed);
            if (startPosition > 0) {
              audioManager.seek(startPosition);
            }
            set({ isLoading: false });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        unloadAudiobook: () => {
          const audioManager = getAudioManager();
          audioManager.pause();

          // Sync final progress before unloading
          get().syncProgress();

          set({
            audiobook: null,
            currentChapter: null,
            chapterIndex: 0,
            isPlaying: false,
            isLoading: false,
            isBuffering: false,
            currentTime: 0,
            duration: 0,
            isVisible: false,
            isMinimized: false,
            sleepTimer: null,
            sleepTimerEndTime: null,
            error: null,
          });
        },

        // UI
        minimize: () => set({ isMinimized: true }),
        maximize: () => set({ isMinimized: false }),
        hide: () => set({ isVisible: false }),
        show: () => set({ isVisible: true }),

        // Progress sync
        syncProgress: async () => {
          const { audiobook, chapterIndex, currentTime, playbackSpeed } = get();
          if (!audiobook) return;

          try {
            await apiClient.post(`/audiobooks/${audiobook.id}/progress`, {
              chapterIndex,
              positionSeconds: Math.floor(currentTime),
              playbackSpeed,
            });
          } catch (error) {
            console.error('Failed to sync audiobook progress:', error);
          }
        },
      };
    },
    {
      name: 'audio-player-storage',
      partialize: (state) => ({
        playbackSpeed: state.playbackSpeed,
        volume: state.volume,
        // Don't persist audiobook state - will reload from server
      }),
    }
  )
);

// Helper hook to get formatted time
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper to format duration in human readable format
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}
