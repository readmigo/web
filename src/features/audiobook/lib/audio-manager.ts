import type { PlaybackSpeed, AudiobookParagraph } from '../types';
import { log } from '@/lib/logger';

type AudioEventCallback = () => void;
type TimeUpdateCallback = (currentTime: number, duration: number) => void;
type ErrorCallback = (error: Error) => void;

interface AudioManagerEvents {
  play: AudioEventCallback;
  pause: AudioEventCallback;
  ended: AudioEventCallback;
  timeupdate: TimeUpdateCallback;
  loadstart: AudioEventCallback;
  canplay: AudioEventCallback;
  waiting: AudioEventCallback;
  error: ErrorCallback;
}

/**
 * Audio Manager - Handles HTML5 Audio playback with paragraph-based sequential playback
 */
export class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private events: Partial<AudioManagerEvents> = {};
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;

  // Paragraph-based playback state
  private paragraphs: AudiobookParagraph[] = [];
  private currentParagraphIndex = 0;
  private paragraphMode = false;
  private paragraphTimeOffset = 0; // accumulated duration of previous paragraphs
  private totalParagraphDuration = 0;
  private prefetchedUrls = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('play', () => {
      this.events.play?.();
      this.startTimeUpdateInterval();
    });

    this.audio.addEventListener('pause', () => {
      this.events.pause?.();
      this.stopTimeUpdateInterval();
    });

    this.audio.addEventListener('ended', () => {
      if (this.paragraphMode) {
        this.advanceParagraph();
        return;
      }
      this.events.ended?.();
      this.stopTimeUpdateInterval();
    });

    this.audio.addEventListener('loadstart', () => {
      this.events.loadstart?.();
    });

    this.audio.addEventListener('canplay', () => {
      this.events.canplay?.();
    });

    this.audio.addEventListener('waiting', () => {
      this.events.waiting?.();
    });

    this.audio.addEventListener('error', () => {
      const errorCode = this.audio?.error?.code;
      const errorMessage = this.audio?.error?.message || 'Audio playback error';
      log.audiobook.error('[AudioManager] Playback error event', {
        src: this.audio?.src,
        errorCode,
        errorMessage,
        networkState: this.audio?.networkState,
        readyState: this.audio?.readyState,
      });
      const error = new Error(errorMessage);
      this.events.error?.(error);
    });
  }

  private startTimeUpdateInterval() {
    this.stopTimeUpdateInterval();
    this.timeUpdateInterval = setInterval(() => {
      if (this.audio) {
        if (this.paragraphMode) {
          // Report chapter-level time = offset of previous paragraphs + current paragraph time
          const chapterTime = this.paragraphTimeOffset + (this.audio.currentTime || 0);
          this.events.timeupdate?.(chapterTime, this.totalParagraphDuration);
        } else {
          this.events.timeupdate?.(this.audio.currentTime, this.audio.duration || 0);
        }
      }
    }, 250); // Update every 250ms
  }

  private stopTimeUpdateInterval() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  /**
   * Load an audio source
   */
  load(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.audio) {
        reject(new Error('Audio not supported'));
        return;
      }

      log.audiobook.info('[AudioManager] Loading audio', { src });

      const handleCanPlay = () => {
        this.audio?.removeEventListener('canplay', handleCanPlay);
        this.audio?.removeEventListener('error', handleError);
        log.audiobook.info('[AudioManager] Audio canplay', { src });
        resolve();
      };

      const handleError = () => {
        this.audio?.removeEventListener('canplay', handleCanPlay);
        this.audio?.removeEventListener('error', handleError);
        const errorCode = this.audio?.error?.code;
        const errorMessage = this.audio?.error?.message || 'Failed to load audio';
        log.audiobook.error('[AudioManager] Audio load error', {
          src,
          errorCode,
          errorMessage,
          networkState: this.audio?.networkState,
          readyState: this.audio?.readyState,
        });
        reject(new Error(errorMessage));
      };

      this.audio.addEventListener('canplay', handleCanPlay);
      this.audio.addEventListener('error', handleError);
      this.audio.src = src;
      this.audio.load();
    });
  }

  /**
   * Play audio
   */
  async play(): Promise<void> {
    if (!this.audio) return;
    try {
      await this.audio.play();
    } catch (error) {
      log.audiobook.error('Failed to play audio', error);
      throw error;
    }
  }

  /**
   * Pause audio
   */
  pause(): void {
    this.audio?.pause();
  }

  /**
   * Toggle play/pause
   */
  async togglePlay(): Promise<void> {
    if (this.isPlaying()) {
      this.pause();
    } else {
      await this.play();
    }
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
    }
  }

  /**
   * Seek forward by seconds
   */
  seekForward(seconds = 15): void {
    if (this.audio) {
      this.seek(this.audio.currentTime + seconds);
    }
  }

  /**
   * Seek backward by seconds
   */
  seekBackward(seconds = 15): void {
    if (this.audio) {
      this.seek(this.audio.currentTime - seconds);
    }
  }

  /**
   * Set playback speed
   */
  setPlaybackSpeed(speed: PlaybackSpeed): void {
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Check if audio is playing
   */
  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  /**
   * Get duration
   */
  getDuration(): number {
    return this.audio?.duration || 0;
  }

  /**
   * Get playback speed
   */
  getPlaybackSpeed(): number {
    return this.audio?.playbackRate || 1;
  }

  /**
   * Get volume
   */
  getVolume(): number {
    return this.audio?.volume || 1;
  }

  /**
   * Subscribe to events
   */
  on<K extends keyof AudioManagerEvents>(event: K, callback: AudioManagerEvents[K]): void {
    this.events[event] = callback as any;
  }

  /**
   * Unsubscribe from events
   */
  off<K extends keyof AudioManagerEvents>(event: K): void {
    delete this.events[event];
  }

  /**
   * Load a chapter as a paragraph sequence (for TTS-generated audiobooks)
   * Plays paragraphs sequentially, prefetches next 3
   */
  async loadParagraphSequence(
    paragraphs: AudiobookParagraph[],
    seekTo = 0,
    playbackSpeed: PlaybackSpeed = 1.0,
  ): Promise<void> {
    // Filter out paragraphs with no audio
    const playable = paragraphs.filter((p) => p.audioUrl && p.audioUrl.length > 0);
    if (playable.length === 0) {
      throw new Error('No playable paragraphs in chapter');
    }

    this.paragraphs = playable;
    this.paragraphMode = true;
    this.totalParagraphDuration = playable.reduce((sum, p) => sum + p.duration, 0);
    this.prefetchedUrls.clear();

    // Find starting paragraph based on seek position
    let startIndex = 0;
    let seekOffset = 0;
    if (seekTo > 0) {
      let accumulated = 0;
      for (let i = 0; i < playable.length; i++) {
        if (accumulated + playable[i].duration > seekTo) {
          startIndex = i;
          seekOffset = seekTo - accumulated;
          break;
        }
        accumulated += playable[i].duration;
        if (i === playable.length - 1) {
          startIndex = i;
          seekOffset = 0;
        }
      }
    }

    // Calculate time offset for paragraphs before startIndex
    this.paragraphTimeOffset = 0;
    for (let i = 0; i < startIndex; i++) {
      this.paragraphTimeOffset += playable[i].duration;
    }
    this.currentParagraphIndex = startIndex;

    log.audiobook.info('[AudioManager] Loading paragraph sequence', {
      total: playable.length,
      startIndex,
      seekOffset,
      totalDuration: this.totalParagraphDuration,
    });

    await this.loadParagraph(startIndex);
    if (this.audio) {
      this.audio.playbackRate = playbackSpeed;
      if (seekOffset > 0) {
        this.audio.currentTime = seekOffset;
      }
    }

    this.prefetchNextParagraphs(startIndex);
  }

  private async loadParagraph(index: number): Promise<void> {
    const para = this.paragraphs[index];
    if (!para?.audioUrl) {
      log.audiobook.warn('[AudioManager] Skipping paragraph with no URL', { index });
      // Skip to next
      if (index + 1 < this.paragraphs.length) {
        this.currentParagraphIndex = index + 1;
        this.paragraphTimeOffset += para?.duration || 0;
        return this.loadParagraph(index + 1);
      }
      // No more paragraphs — chapter ended
      this.clearParagraphState();
      this.events.ended?.();
      return;
    }

    log.audiobook.debug('[AudioManager] Loading paragraph', {
      index,
      url: para.audioUrl.split('/').slice(-2).join('/'),
    });

    await this.load(para.audioUrl);
  }

  private async advanceParagraph(): Promise<void> {
    // Update time offset with finished paragraph's duration
    const finishedPara = this.paragraphs[this.currentParagraphIndex];
    if (finishedPara) {
      this.paragraphTimeOffset += finishedPara.duration;
    }

    const nextIndex = this.currentParagraphIndex + 1;
    if (nextIndex >= this.paragraphs.length) {
      log.audiobook.info('[AudioManager] Paragraph chapter complete', {
        total: this.paragraphs.length,
      });
      this.clearParagraphState();
      this.events.ended?.();
      this.stopTimeUpdateInterval();
      return;
    }

    this.currentParagraphIndex = nextIndex;

    try {
      await this.loadParagraph(nextIndex);
      if (this.audio) {
        await this.audio.play();
      }
      this.prefetchNextParagraphs(nextIndex);
    } catch (error) {
      log.audiobook.error('[AudioManager] Failed to advance paragraph', {
        index: nextIndex,
        error: (error as Error).message,
      });
      // Try skipping to next paragraph
      if (nextIndex + 1 < this.paragraphs.length) {
        this.advanceParagraph();
      } else {
        this.clearParagraphState();
        this.events.ended?.();
      }
    }
  }

  private prefetchNextParagraphs(fromIndex: number): void {
    const end = Math.min(fromIndex + 4, this.paragraphs.length);
    for (let i = fromIndex + 1; i < end; i++) {
      const url = this.paragraphs[i]?.audioUrl;
      if (url && !this.prefetchedUrls.has(url)) {
        this.prefetchedUrls.add(url);
        // Use link preload for browser-level prefetch
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'audio';
        link.href = url;
        document.head.appendChild(link);
      }
    }
  }

  private clearParagraphState(): void {
    this.paragraphs = [];
    this.currentParagraphIndex = 0;
    this.paragraphMode = false;
    this.paragraphTimeOffset = 0;
    this.totalParagraphDuration = 0;
    this.prefetchedUrls.clear();
  }

  /** Whether currently in paragraph-based playback mode */
  isParagraphMode(): boolean {
    return this.paragraphMode;
  }

  /**
   * Seek to a chapter-level time in paragraph mode
   */
  async seekParagraph(chapterTime: number): Promise<void> {
    if (!this.paragraphMode || this.paragraphs.length === 0) return;

    let accumulated = 0;
    for (let i = 0; i < this.paragraphs.length; i++) {
      if (accumulated + this.paragraphs[i].duration > chapterTime) {
        const wasPlaying = this.isPlaying();
        this.currentParagraphIndex = i;
        this.paragraphTimeOffset = accumulated;
        await this.loadParagraph(i);
        if (this.audio) {
          this.audio.currentTime = chapterTime - accumulated;
          if (wasPlaying) await this.audio.play();
        }
        this.prefetchNextParagraphs(i);
        return;
      }
      accumulated += this.paragraphs[i].duration;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopTimeUpdateInterval();
    this.clearParagraphState();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.events = {};
  }
}

// Singleton instance
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}
