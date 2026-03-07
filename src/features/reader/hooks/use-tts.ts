'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api/client';

// ─── Types (aligned with iOS TTS.swift) ──────────────────────────────────────

export type TTSHighlightMode = 'none' | 'word' | 'sentence' | 'paragraph';
export type TTSReadingMode = 'continuous' | 'chapter' | 'selection';
export type TTSState = 'idle' | 'playing' | 'paused' | 'loading';
export type TTSAudioSource = 'system' | { cloud: string };

export interface TTSSettings {
  rate: number;                       // 0.5–2.0, default 1.0
  pitch: number;                      // 0.5–2.0, default 1.0
  volume: number;                     // 0.0–1.0, default 1.0
  voiceURI: string | null;            // system voice identifier
  language: string;                   // e.g. "en-US"
  highlightMode: TTSHighlightMode;
  autoScroll: boolean;
  autoPageTurn: boolean;
  sleepTimerMinutes: number | null;   // null = off, -1 = end of chapter
  readingMode: TTSReadingMode;
  pauseBetweenSentences: number;      // seconds: 0.2 / 0.3 / 0.5
  pauseBetweenParagraphs: number;     // seconds: 0.5 / 0.8 / 1.2
  audioSource: TTSAudioSource;
}

const DEFAULT_SETTINGS: TTSSettings = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  voiceURI: null,
  language: 'en-US',
  highlightMode: 'sentence',
  autoScroll: true,
  autoPageTurn: true,
  sleepTimerMinutes: null,
  readingMode: 'continuous',
  pauseBetweenSentences: 0.3,
  pauseBetweenParagraphs: 0.8,
  audioSource: 'system',
};

export interface SystemVoice {
  id: string;         // voiceURI
  name: string;
  language: string;
  quality: 'default' | 'enhanced';
  gender: 'male' | 'female' | 'neutral';
  voiceURI: string;
}

export interface CloudVoice {
  voiceId: string;
  displayName: string;
  gender: string;
  accent: string;
  quality: string;
  minPlan: string;
  provider: string;
  sampleUrl: string | null;
  available: boolean;
}

export interface TTSProgress {
  sentenceIndex: number;
  totalSentences: number;
  paragraphIndex: number;
  totalParagraphs: number;
  currentText: string;
  percentage: number;
}

export type SleepTimerOptionValue = 0 | 5 | 10 | 15 | 30 | 45 | 60 | -1;

// Labels are intentionally omitted here — use getSleepTimerLabel() in the component with translations
export const SLEEP_TIMER_OPTIONS: Array<{ value: SleepTimerOptionValue }> = [
  { value: 0 },
  { value: 5 },
  { value: 10 },
  { value: 15 },
  { value: 30 },
  { value: 45 },
  { value: 60 },
  { value: -1 },
];

const STORAGE_KEY = 'readmigo_tts_settings_v2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\n(?=\S)/)
    .map((p) => p.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 2);
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Novelty/effect voices not suitable for reading (mirrors iOS TTSVoice.noveltyVoiceIDs)
const NOVELTY_VOICES = new Set([
  'com.apple.speech.synthesis.voice.Albert',
  'com.apple.speech.synthesis.voice.BadNews',
  'com.apple.speech.synthesis.voice.Bahh',
  'com.apple.speech.synthesis.voice.Bells',
  'com.apple.speech.synthesis.voice.Boing',
  'com.apple.speech.synthesis.voice.Bubbles',
  'com.apple.speech.synthesis.voice.Cellos',
  'com.apple.speech.synthesis.voice.Deranged',
  'com.apple.speech.synthesis.voice.GoodNews',
  'com.apple.speech.synthesis.voice.Hysterical',
  'com.apple.speech.synthesis.voice.Junior',
  'com.apple.speech.synthesis.voice.Kathy',
  'com.apple.speech.synthesis.voice.Organ',
  'com.apple.speech.synthesis.voice.Princess',
  'com.apple.speech.synthesis.voice.Ralph',
  'com.apple.speech.synthesis.voice.Trinoids',
  'com.apple.speech.synthesis.voice.Whisper',
  'com.apple.speech.synthesis.voice.Zarvox',
]);

function guessGender(name: string): 'male' | 'female' | 'neutral' {
  const n = name.toLowerCase();
  const female = ['samantha', 'karen', 'moira', 'tessa', 'fiona', 'veena', 'alice', 'alva', 'amelie', 'anna', 'carmit', 'damayanti', 'ellen', 'ioana', 'joana', 'kanya', 'kyoko', 'laila', 'laura', 'lekha', 'luciana', 'mariska', 'melina', 'milena', 'nora', 'paulina', 'sara', 'satu', 'sinji', 'tina', 'yuna', 'yelda', 'zosia', 'zuzana', 'female', 'woman', 'mei-jia'];
  const male = ['alex', 'daniel', 'diego', 'fred', 'jorge', 'juan', 'lee', 'male', 'man', 'oliver', 'thomas', 'tom', 'xander', 'yuri'];
  for (const w of female) if (n.includes(w)) return 'female';
  for (const w of male) if (n.includes(w)) return 'male';
  return 'neutral';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTTS() {
  const [ttsState, setTtsState] = useState<TTSState>('idle');
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_SETTINGS);
  const [systemVoices, setSystemVoices] = useState<SystemVoice[]>([]);
  const [cloudVoices, setCloudVoices] = useState<CloudVoice[]>([]);
  const [cloudVoicesError, setCloudVoicesError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TTSProgress | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Refs for imperative playback (no re-render needed)
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settingsRef = useRef(settings);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepRemainingRef = useRef<number | null>(null);

  // All mutable playback state in one ref
  const pbRef = useRef({
    isActive: false,
    paragraphs: [] as string[],
    paraIndex: 0,
    sentences: [] as string[],
    sentIndex: 0,
  });

  // Keep settingsRef current
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }
    synthRef.current = window.speechSynthesis;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings((p) => ({ ...p, ...JSON.parse(saved) }));
    } catch { /* ignore */ }

    const loadVoices = () => {
      const avail = synthRef.current?.getVoices() || [];
      setSystemVoices(
        avail
          .filter((v) => !NOVELTY_VOICES.has(v.voiceURI))
          .map((v) => ({
            id: v.voiceURI,
            name: v.name,
            language: v.lang,
            quality: /enhanced|premium/i.test(v.name) ? 'enhanced' as const : 'default' as const,
            gender: guessGender(v.name),
            voiceURI: v.voiceURI,
          }))
      );
    };
    loadVoices();
    synthRef.current.onvoiceschanged = loadVoices;

    return () => {
      synthRef.current?.cancel();
      clearSleepTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  // ─── Sleep timer ────────────────────────────────────────────────────────────

  const clearSleepTimer = () => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    sleepIntervalRef.current = null;
    sleepRemainingRef.current = null;
    setSleepTimerRemaining(null);
  };

  const startSleepTimer = (minutes: number) => {
    clearSleepTimer();
    if (minutes <= 0) return;
    const secs = minutes * 60;
    sleepRemainingRef.current = secs;
    setSleepTimerRemaining(secs);
    sleepIntervalRef.current = setInterval(() => {
      const rem = (sleepRemainingRef.current ?? 1) - 1;
      sleepRemainingRef.current = rem;
      setSleepTimerRemaining(rem);
      if (rem <= 0) {
        clearSleepTimer();
        doStop();
      }
    }, 1000);
  };

  // ─── Core stop ──────────────────────────────────────────────────────────────

  const doStop = useCallback(() => {
    pbRef.current.isActive = false;
    synthRef.current?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    clearSleepTimer();
    setTtsState('idle');
    setProgress(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Advance engine (assigned on every render to stay fresh) ────────────────

  const advanceRef = useRef<() => Promise<void>>(async () => {});

  advanceRef.current = async () => {
    const pb = pbRef.current;
    if (!pb.isActive) return;
    const s = settingsRef.current;

    // End of paragraph?
    if (pb.sentIndex >= pb.sentences.length) {
      const nextPara = pb.paraIndex + 1;
      if (nextPara >= pb.paragraphs.length) {
        pb.isActive = false;
        setTtsState('idle');
        setProgress(null);
        clearSleepTimer();
        return;
      }
      pb.paraIndex = nextPara;
      pb.sentences = splitIntoSentences(pb.paragraphs[nextPara]);
      pb.sentIndex = 0;
      await sleep(s.pauseBetweenParagraphs * 1000);
      if (pb.isActive) await advanceRef.current();
      return;
    }

    const sentence = pb.sentences[pb.sentIndex];
    pb.sentIndex += 1;

    setProgress({
      sentenceIndex: pb.sentIndex - 1,
      totalSentences: pb.sentences.length,
      paragraphIndex: pb.paraIndex,
      totalParagraphs: pb.paragraphs.length,
      currentText: sentence,
      percentage:
        ((pb.paraIndex + (pb.sentIndex - 1) / Math.max(pb.sentences.length, 1)) /
          Math.max(pb.paragraphs.length, 1)) *
        100,
    });

    const afterSentence = async () => {
      await sleep(s.pauseBetweenSentences * 1000);
      if (pb.isActive) await advanceRef.current();
    };

    if (typeof s.audioSource !== 'string') {
      // Cloud TTS
      try {
        setTtsState('loading');
        const res = await apiClient.post<{ audioUrl: string }>('/tts/generate', {
          text: sentence,
          voiceId: s.audioSource.cloud,
          speed: s.rate,
          includeTimestamps: false,
        });
        if (!pb.isActive) return;
        setTtsState('playing');
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(res.audioUrl);
          audioRef.current = audio;
          audio.volume = s.volume;
          audio.onended = () => { audioRef.current = null; resolve(); };
          audio.onerror = () => reject(new Error('Audio error'));
          audio.play().catch(reject);
        });
        if (pb.isActive) await afterSentence();
      } catch {
        pb.isActive = false;
        setTtsState('idle');
      }
    } else {
      // System TTS (Web Speech API)
      await new Promise<void>((resolve) => {
        if (!synthRef.current) { resolve(); return; }
        synthRef.current.cancel();
        const utt = new SpeechSynthesisUtterance(sentence);
        utt.rate = s.rate;
        utt.pitch = s.pitch;
        utt.volume = s.volume;
        if (s.voiceURI) {
          const voice = synthRef.current.getVoices().find((v) => v.voiceURI === s.voiceURI);
          if (voice) utt.voice = voice;
        }
        utt.onend = () => resolve();
        utt.onerror = () => resolve();
        synthRef.current.speak(utt);
      });
      if (pb.isActive) await afterSentence();
    }
  };

  // ─── Public controls ────────────────────────────────────────────────────────

  const speak = useCallback((text: string) => {
    const paragraphs = splitIntoParagraphs(text);
    if (paragraphs.length === 0) return;

    doStop();
    const pb = pbRef.current;
    pb.paragraphs = paragraphs;
    pb.paraIndex = 0;
    pb.sentences = splitIntoSentences(paragraphs[0]);
    pb.sentIndex = 0;
    pb.isActive = true;

    setTtsState('playing');

    const { sleepTimerMinutes } = settingsRef.current;
    if (sleepTimerMinutes && sleepTimerMinutes > 0) startSleepTimer(sleepTimerMinutes);

    void advanceRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doStop]);

  const pause = useCallback(() => {
    pbRef.current.isActive = false;
    synthRef.current?.pause();
    audioRef.current?.pause();
    setTtsState('paused');
  }, []);

  const resume = useCallback(() => {
    pbRef.current.isActive = true;
    setTtsState('playing');
    const s = settingsRef.current;
    if (typeof s.audioSource !== 'string') {
      if (audioRef.current?.paused && audioRef.current.src) {
        void audioRef.current.play();
      } else {
        void advanceRef.current(); // between cloud sentences
      }
    } else {
      if (synthRef.current?.paused) {
        synthRef.current.resume();
      } else {
        void advanceRef.current(); // between system sentences
      }
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (ttsState === 'playing' || ttsState === 'loading') pause();
    else if (ttsState === 'paused') resume();
  }, [ttsState, pause, resume]);

  const nextSentence = useCallback(() => {
    if (ttsState === 'idle') return;
    synthRef.current?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    pbRef.current.isActive = true;
    setTtsState('playing');
    void advanceRef.current();
  }, [ttsState]);

  const setSleepTimer = useCallback((option: SleepTimerOptionValue) => {
    setSettings((s) => ({ ...s, sleepTimerMinutes: option === 0 ? null : option }));
    if (option === 0) {
      clearSleepTimer();
    } else if (ttsState === 'playing' && option > 0) {
      startSleepTimer(option);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsState]);

  const setRate = useCallback((rate: number) => {
    setSettings((s) => ({ ...s, rate }));
  }, []);

  const setCloudVoice = useCallback((voiceId: string) => {
    setSettings((s) => ({ ...s, audioSource: { cloud: voiceId } }));
  }, []);

  const setSystemVoice = useCallback((voiceURI: string | null) => {
    setSettings((s) => ({ ...s, audioSource: 'system', voiceURI }));
  }, []);

  const updateSettings = useCallback((partial: Partial<TTSSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  const loadCloudVoices = useCallback(async (bookId?: string, errorMessage?: string) => {
    setCloudVoicesError(null);
    try {
      const ep = bookId ? `/tts/voices?bookId=${bookId}` : '/tts/voices';
      const res = await apiClient.get<{ voices: CloudVoice[] }>(ep, { noRedirectOn401: true });
      setCloudVoices(res.voices ?? []);
    } catch {
      setCloudVoicesError(errorMessage ?? 'Failed to load cloud voices');
    }
  }, []);

  return {
    ttsState,
    settings,
    systemVoices,
    cloudVoices,
    cloudVoicesError,
    progress,
    sleepTimerRemaining,
    isSupported,
    speak,
    pause,
    resume,
    stop: doStop,
    togglePlayPause,
    nextSentence,
    setSleepTimer,
    setRate,
    setCloudVoice,
    setSystemVoice,
    updateSettings,
    loadCloudVoices,
  };
}

export type UseTTSReturn = ReturnType<typeof useTTS>;
