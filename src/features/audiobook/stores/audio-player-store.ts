import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAudioManager } from '../lib/audio-manager';
import { apiClient } from '@/lib/api/client';
import { log } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import {
  savePendingSession,
  removePendingSession,
} from '@/features/reader/lib/pending-sessions';
import type {
  Audiobook,
  AudiobookChapter,
  AudioPlayerState,
  AudioPlayerActions,
  PlaybackSpeed,
  SleepTimerOption,
  AudiobookVoice,
} from '../types';

interface AudioPlayerStore extends AudioPlayerState, AudioPlayerActions {}

/** Check if a chapter has playable audio (either direct URL or paragraphs) */
function isPlayableChapter(chapter: AudiobookChapter): boolean {
  if (chapter.audioUrl) return true;
  if (chapter.paragraphs && chapter.paragraphs.some((p) => p.audioUrl)) return true;
  return false;
}

/** Find the next playable chapter index starting from `fromIndex` */
function findPlayableChapter(chapters: AudiobookChapter[], fromIndex: number): number {
  for (let i = fromIndex; i < chapters.length; i++) {
    if (isPlayableChapter(chapters[i])) return i;
  }
  return -1;
}

function getDeviceId(): string {
  const key = 'readmigo_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

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
          const { audiobook, chapterIndex } = get();
          if (audiobook) {
            trackEvent('audiobook_play_started', {
              audiobook_id: audiobook.id,
              audiobook_title: audiobook.title,
              chapter_index: chapterIndex,
            });
          }
        });

        audioManager.on('pause', () => {
          set({ isPlaying: false });
        });

        audioManager.on('ended', () => {
          const { audiobook, chapterIndex, currentTime } = get();
          if (audiobook) {
            trackEvent('audiobook_play_ended', {
              audiobook_id: audiobook.id,
              chapter_index: chapterIndex,
              position_seconds: Math.floor(currentTime),
            });
          }
          // Submit session for completed chapter
          get().submitAudiobookSession();
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
        selectedVoiceId: null,
        isMinimized: false,
        isVisible: false,
        shouldOpenFullPlayer: false,
        sleepTimer: null,
        sleepTimerEndTime: null,
        sessionStartTime: null,
        sessionStartPosition: 0,
        error: null,

        // Playback controls
        play: async () => {
          // Rule 3: Audiobook ↔ TTS mutual exclusion — stop any active TTS before playing
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }

          const audioManager = getAudioManager();
          try {
            // Record session start if not already tracking
            const { sessionStartTime, currentTime } = get();
            if (!sessionStartTime) {
              set({ sessionStartTime: Date.now(), sessionStartPosition: currentTime });
            }
            await audioManager.play();
          } catch (error) {
            set({ error: (error as Error).message });
          }
        },

        pause: () => {
          const audioManager = getAudioManager();
          audioManager.pause();
          // Submit session on pause if duration >= 10s
          get().submitAudiobookSession();
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
          if (audioManager.isParagraphMode()) {
            audioManager.seekParagraph(time);
          } else {
            audioManager.seek(time);
          }
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

          // Find next playable chapter
          const nextIndex = findPlayableChapter(audiobook.chapters, chapterIndex + 1);
          if (nextIndex === -1) {
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
          const isParagraphMode = !nextChapter.audioUrl && nextChapter.paragraphs && nextChapter.paragraphs.length > 0;
          set({
            chapterIndex: nextIndex,
            currentChapter: nextChapter,
            currentTime: 0,
            duration: isParagraphMode
              ? nextChapter.paragraphs!.reduce((sum, p) => sum + p.duration, 0)
              : nextChapter.duration,
            isLoading: true,
          });

          const audioManager = getAudioManager();
          try {
            if (isParagraphMode) {
              await audioManager.loadParagraphSequence(nextChapter.paragraphs!, 0, playbackSpeed);
            } else {
              await audioManager.load(nextChapter.audioUrl);
              audioManager.setPlaybackSpeed(playbackSpeed);
            }
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
            const audioManager = getAudioManager();
            if (audioManager.isParagraphMode()) {
              await audioManager.seekParagraph(0);
            } else {
              get().seek(0);
            }
            return;
          }

          // Find previous playable chapter
          let prevIndex = -1;
          for (let i = chapterIndex - 1; i >= 0; i--) {
            if (isPlayableChapter(audiobook.chapters[i])) {
              prevIndex = i;
              break;
            }
          }
          if (prevIndex < 0) return;

          const prevChapter = audiobook.chapters[prevIndex];
          const isParagraphMode = !prevChapter.audioUrl && prevChapter.paragraphs && prevChapter.paragraphs.length > 0;
          set({
            chapterIndex: prevIndex,
            currentChapter: prevChapter,
            currentTime: 0,
            duration: isParagraphMode
              ? prevChapter.paragraphs!.reduce((sum, p) => sum + p.duration, 0)
              : prevChapter.duration,
            isLoading: true,
          });

          const audioManager = getAudioManager();
          try {
            if (isParagraphMode) {
              await audioManager.loadParagraphSequence(prevChapter.paragraphs!, 0, playbackSpeed);
            } else {
              await audioManager.load(prevChapter.audioUrl);
              audioManager.setPlaybackSpeed(playbackSpeed);
            }
            await audioManager.play();
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        goToChapter: async (index: number) => {
          const { audiobook, playbackSpeed, isPlaying } = get();
          if (!audiobook || index < 0 || index >= audiobook.chapters.length) return;

          const chapter = audiobook.chapters[index];
          const isParagraphMode = !chapter.audioUrl && chapter.paragraphs && chapter.paragraphs.length > 0;
          set({
            chapterIndex: index,
            currentChapter: chapter,
            currentTime: 0,
            duration: isParagraphMode
              ? chapter.paragraphs!.reduce((sum, p) => sum + p.duration, 0)
              : chapter.duration,
            isLoading: true,
          });

          const audioManager = getAudioManager();
          try {
            if (isParagraphMode) {
              await audioManager.loadParagraphSequence(chapter.paragraphs!, 0, playbackSpeed);
            } else {
              await audioManager.load(chapter.audioUrl);
              audioManager.setPlaybackSpeed(playbackSpeed);
            }
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

          // Skip non-playable chapters (e.g., Cover with no audio)
          let chapterIdx = startChapter;
          if (!isPlayableChapter(audiobook.chapters[chapterIdx])) {
            const playable = findPlayableChapter(audiobook.chapters, chapterIdx);
            if (playable === -1) {
              log.audiobook.error('[PlayerStore] No playable chapters found', {
                audiobookId: audiobook.id,
              });
              set({ error: 'No playable chapters', isLoading: false });
              return;
            }
            log.audiobook.info('[PlayerStore] Skipping non-playable chapters', {
              from: chapterIdx,
              to: playable,
              skippedTitle: audiobook.chapters[chapterIdx]?.title,
            });
            chapterIdx = playable;
            startPosition = 0; // Reset position when skipping
          }

          const chapter = audiobook.chapters[chapterIdx];
          const isParagraphMode = !chapter.audioUrl && chapter.paragraphs && chapter.paragraphs.length > 0;

          log.audiobook.info('[PlayerStore] loadAudiobook', {
            audiobookId: audiobook.id,
            title: audiobook.title,
            chapterIndex: chapterIdx,
            startPosition,
            chapterTitle: chapter?.title,
            audioUrl: chapter?.audioUrl,
            paragraphCount: chapter?.paragraphs?.length ?? 0,
            isParagraphMode,
            totalChapters: audiobook.chapters.length,
          });

          set({
            audiobook,
            currentChapter: chapter,
            chapterIndex: chapterIdx,
            currentTime: startPosition,
            duration: isParagraphMode
              ? chapter.paragraphs!.reduce((sum, p) => sum + p.duration, 0)
              : chapter.duration,
            isVisible: true,
            isMinimized: false,
            shouldOpenFullPlayer: true,
            error: null,
            isLoading: true,
          });

          const audioManager = getAudioManager();
          try {
            if (isParagraphMode) {
              await audioManager.loadParagraphSequence(chapter.paragraphs!, startPosition, playbackSpeed);
            } else {
              await audioManager.load(chapter.audioUrl);
              audioManager.setPlaybackSpeed(playbackSpeed);
              if (startPosition > 0) {
                audioManager.seek(startPosition);
              }
            }
            log.audiobook.info('[PlayerStore] loadAudiobook success', {
              audiobookId: audiobook.id,
              isParagraphMode,
            });
            set({ isLoading: false });
          } catch (error) {
            log.audiobook.error('[PlayerStore] loadAudiobook failed', {
              audiobookId: audiobook.id,
              audioUrl: chapter?.audioUrl,
              isParagraphMode,
              error: (error as Error).message,
            });
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        setSelectedVoice: async (voiceId: string) => {
          const { audiobook, chapterIndex, playbackSpeed, isPlaying } = get();
          if (!audiobook?.availableVoices) return;

          const voice: AudiobookVoice | undefined = audiobook.availableVoices.find(
            (v) => v.id === voiceId
          );
          if (!voice) return;

          set({ selectedVoiceId: voiceId, isLoading: true, error: null });

          // If the voice carries its own chapter list, swap it in
          const chapters = voice.chapters ?? audiobook.chapters;
          const chapter = chapters[chapterIndex];
          if (!chapter) {
            set({ isLoading: false });
            return;
          }

          const updatedAudiobook: Audiobook = { ...audiobook, chapters };
          const isParagraphMode = !chapter.audioUrl && chapter.paragraphs && chapter.paragraphs.length > 0;
          set({ audiobook: updatedAudiobook, currentChapter: chapter });

          const audioManager = getAudioManager();
          try {
            if (isParagraphMode) {
              await audioManager.loadParagraphSequence(chapter.paragraphs!, 0, playbackSpeed);
            } else {
              await audioManager.load(chapter.audioUrl);
              audioManager.setPlaybackSpeed(playbackSpeed);
            }
            if (isPlaying) {
              await audioManager.play();
            }
            set({ isLoading: false });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        unloadAudiobook: () => {
          const audioManager = getAudioManager();
          audioManager.pause();

          // Submit listening session and sync progress before unloading
          get().submitAudiobookSession();
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
            selectedVoiceId: null,
            isVisible: false,
            isMinimized: false,
            sleepTimer: null,
            sleepTimerEndTime: null,
            sessionStartTime: null,
            sessionStartPosition: 0,
            error: null,
          });
        },

        // UI
        minimize: () => set({ isMinimized: true }),
        maximize: () => set({ isMinimized: false }),
        hide: () => set({ isVisible: false }),
        clearShouldOpenFullPlayer: () => set({ shouldOpenFullPlayer: false }),
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
            }, { noRedirectOn401: true });
          } catch (error) {
            log.audiobook.debug('[syncProgress] skipped (guest or error)', {
              error: (error as Error).message,
            });
          }
        },

        // Audiobook session submission — localStorage first, then API
        submitAudiobookSession: async () => {
          const {
            audiobook,
            chapterIndex,
            currentTime,
            playbackSpeed,
            sessionStartTime,
            sessionStartPosition,
          } = get();

          if (!audiobook || !sessionStartTime) return;

          const endSeconds = Math.floor(currentTime);
          const startSeconds = Math.floor(sessionStartPosition);
          const durationSeconds = Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000));

          if (durationSeconds < 10) return;

          // Reset session tracking state
          set({ sessionStartTime: null, sessionStartPosition: 0 });

          const sessionId = crypto.randomUUID();
          const payload = {
            audiobookId: audiobook.id,
            chapterIndex,
            startSeconds,
            endSeconds,
            durationSeconds,
            playbackSpeed,
            deviceId: getDeviceId(),
            clientVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          };

          // Persist locally first so it survives crashes and network failures
          savePendingSession({
            id: sessionId,
            payload,
            endpoint: '/reading/audiobook-sessions',
            createdAt: Date.now(),
            retryCount: 0,
          });

          try {
            await apiClient.post('/reading/audiobook-sessions', payload, { noRedirectOn401: true });
            removePendingSession(sessionId);
          } catch (error) {
            log.audiobook.debug('[submitSession] skipped (guest or error)', {
              error: (error as Error).message,
            });
            // Session stays in localStorage for retry on next flush
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
