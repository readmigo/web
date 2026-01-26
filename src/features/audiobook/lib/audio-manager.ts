import type { PlaybackSpeed } from '../types';

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
 * Audio Manager - Handles HTML5 Audio playback
 */
export class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private events: Partial<AudioManagerEvents> = {};
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;

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
      const error = new Error(this.audio?.error?.message || 'Audio playback error');
      this.events.error?.(error);
    });
  }

  private startTimeUpdateInterval() {
    this.stopTimeUpdateInterval();
    this.timeUpdateInterval = setInterval(() => {
      if (this.audio) {
        this.events.timeupdate?.(this.audio.currentTime, this.audio.duration || 0);
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

      const handleCanPlay = () => {
        this.audio?.removeEventListener('canplay', handleCanPlay);
        this.audio?.removeEventListener('error', handleError);
        resolve();
      };

      const handleError = () => {
        this.audio?.removeEventListener('canplay', handleCanPlay);
        this.audio?.removeEventListener('error', handleError);
        reject(new Error(this.audio?.error?.message || 'Failed to load audio'));
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
      console.error('Failed to play audio:', error);
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
   * Cleanup
   */
  destroy(): void {
    this.stopTimeUpdateInterval();
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
