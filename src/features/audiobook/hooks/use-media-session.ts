'use client';

import { useEffect } from 'react';
import { useAudioPlayerStore } from '../stores/audio-player-store';
import { log } from '@/lib/logger';

/**
 * Hook to integrate with Media Session API for lock screen controls
 */
export function useMediaSession() {
  const {
    audiobook,
    currentChapter,
    chapterIndex,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seekForward,
    seekBackward,
    nextChapter,
    previousChapter,
    seek,
  } = useAudioPlayerStore();

  useEffect(() => {
    if (!('mediaSession' in navigator) || !audiobook) return;

    // Set metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentChapter?.title || `Chapter ${chapterIndex + 1}`,
      artist: audiobook.author,
      album: audiobook.title,
      artwork: audiobook.coverUrl
        ? [
            { src: audiobook.coverUrl, sizes: '96x96', type: 'image/png' },
            { src: audiobook.coverUrl, sizes: '128x128', type: 'image/png' },
            { src: audiobook.coverUrl, sizes: '192x192', type: 'image/png' },
            { src: audiobook.coverUrl, sizes: '256x256', type: 'image/png' },
            { src: audiobook.coverUrl, sizes: '384x384', type: 'image/png' },
            { src: audiobook.coverUrl, sizes: '512x512', type: 'image/png' },
          ]
        : [],
    });

    // Set playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Set position state (clamp position to valid range to avoid TypeError)
    if (duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(Math.max(0, currentTime), duration),
        });
      } catch {
        // Browser may reject if position > duration during chapter transitions
      }
    }
  }, [audiobook, currentChapter, chapterIndex, isPlaying, currentTime, duration]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Action handlers
    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', () => togglePlay()],
      ['pause', () => togglePlay()],
      ['previoustrack', () => previousChapter()],
      ['nexttrack', () => nextChapter()],
      ['seekbackward', (details) => seekBackward(details?.seekOffset || 15)],
      ['seekforward', (details) => seekForward(details?.seekOffset || 15)],
      ['seekto', (details) => {
        if (details?.seekTime !== undefined) {
          seek(details.seekTime);
        }
      }],
      ['stop', () => {
        // Stop playback
        togglePlay();
      }],
    ];

    // Register handlers
    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        log.audiobook.warn(`Media session action "${action}" not supported`);
      }
    }

    // Cleanup
    return () => {
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore
        }
      }
    };
  }, [togglePlay, previousChapter, nextChapter, seekBackward, seekForward, seek]);
}
