'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TTSVoice {
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
  voiceURI: string;
}

export interface TTSSettings {
  rate: number;      // 0.1 - 10, default 1
  pitch: number;     // 0 - 2, default 1
  volume: number;    // 0 - 1, default 1
  voiceURI: string | null;
}

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  isSpeaking: boolean;
  currentSentenceIndex: number;
  totalSentences: number;
  currentText: string;
  progress: number;
}

const DEFAULT_SETTINGS: TTSSettings = {
  rate: 1,
  pitch: 1,
  volume: 1,
  voiceURI: null,
};

const STORAGE_KEY = 'readmigo_tts_settings';

/**
 * Split text into sentences for TTS
 */
function splitIntoSentences(text: string): string[] {
  // Clean up the text first
  const cleaned = text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split by sentence-ending punctuation, keeping Chinese punctuation
  const sentences = cleaned
    .split(/(?<=[.!?。！？])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences;
}

/**
 * Hook for Text-to-Speech functionality using Web Speech API
 */
export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    isSpeaking: false,
    currentSentenceIndex: 0,
    totalSentences: 0,
    currentText: '',
    progress: 0,
  });

  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_SETTINGS);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [isSupported, setIsSupported] = useState(true);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentencesRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    synthRef.current = window.speechSynthesis;

    // Load saved settings
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Ignore parsing errors
    }

    // Load voices
    const loadVoices = () => {
      const availableVoices = synthRef.current?.getVoices() || [];
      const mapped: TTSVoice[] = availableVoices.map((v) => ({
        name: v.name,
        lang: v.lang,
        default: v.default,
        localService: v.localService,
        voiceURI: v.voiceURI,
      }));
      setVoices(mapped);
    };

    // Voices may load asynchronously
    loadVoices();
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  // Get voice object by URI
  const getVoice = useCallback((voiceURI: string | null): SpeechSynthesisVoice | null => {
    if (!voiceURI || !synthRef.current) return null;
    const availableVoices = synthRef.current.getVoices();
    return availableVoices.find((v) => v.voiceURI === voiceURI) || null;
  }, []);

  // Speak a single sentence
  const speakSentence = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current || !text) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    const voice = getVoice(settings.voiceURI);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setState((prev) => ({
        ...prev,
        isSpeaking: true,
        currentText: text,
      }));
    };

    utterance.onend = () => {
      setState((prev) => ({
        ...prev,
        isSpeaking: false,
      }));
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event.error);
      setState((prev) => ({
        ...prev,
        isSpeaking: false,
        isPlaying: false,
      }));
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [settings, getVoice]);

  // Speak next sentence in sequence
  const speakNextSentence = useCallback(() => {
    if (!isPlayingRef.current) return;

    const sentences = sentencesRef.current;
    const index = currentIndexRef.current;

    if (index >= sentences.length) {
      // Finished all sentences
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isSpeaking: false,
        progress: 100,
      }));
      isPlayingRef.current = false;
      return;
    }

    const sentence = sentences[index];
    currentIndexRef.current = index + 1;

    setState((prev) => ({
      ...prev,
      currentSentenceIndex: index,
      progress: (index / sentences.length) * 100,
    }));

    speakSentence(sentence, speakNextSentence);
  }, [speakSentence]);

  // Start speaking text
  const speak = useCallback((text: string, startFromIndex = 0) => {
    if (!synthRef.current || !text) return;

    // Split into sentences
    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) return;

    sentencesRef.current = sentences;
    currentIndexRef.current = startFromIndex;
    isPlayingRef.current = true;

    setState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      totalSentences: sentences.length,
      currentSentenceIndex: startFromIndex,
      progress: (startFromIndex / sentences.length) * 100,
    }));

    speakNextSentence();
  }, [speakNextSentence]);

  // Pause speech
  const pause = useCallback(() => {
    if (!synthRef.current) return;

    synthRef.current.pause();
    isPlayingRef.current = false;

    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
    }));
  }, []);

  // Resume speech
  const resume = useCallback(() => {
    if (!synthRef.current) return;

    synthRef.current.resume();
    isPlayingRef.current = true;

    setState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
    }));
  }, []);

  // Stop speech
  const stop = useCallback(() => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    isPlayingRef.current = false;
    currentIndexRef.current = 0;
    sentencesRef.current = [];

    setState({
      isPlaying: false,
      isPaused: false,
      isSpeaking: false,
      currentSentenceIndex: 0,
      totalSentences: 0,
      currentText: '',
      progress: 0,
    });
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (state.isPaused) {
      resume();
    } else if (state.isPlaying) {
      pause();
    }
  }, [state.isPlaying, state.isPaused, pause, resume]);

  // Skip to next sentence
  const nextSentence = useCallback(() => {
    if (!synthRef.current) return;

    synthRef.current.cancel();

    if (currentIndexRef.current < sentencesRef.current.length) {
      speakNextSentence();
    }
  }, [speakNextSentence]);

  // Skip to previous sentence
  const previousSentence = useCallback(() => {
    if (!synthRef.current) return;

    synthRef.current.cancel();

    const newIndex = Math.max(0, currentIndexRef.current - 2);
    currentIndexRef.current = newIndex;

    if (isPlayingRef.current) {
      speakNextSentence();
    }
  }, [speakNextSentence]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Get voices for a specific language
  const getVoicesForLanguage = useCallback((langPrefix: string): TTSVoice[] => {
    return voices.filter((v) => v.lang.startsWith(langPrefix));
  }, [voices]);

  return {
    // State
    state,
    settings,
    voices,
    isSupported,

    // Actions
    speak,
    pause,
    resume,
    stop,
    togglePlayPause,
    nextSentence,
    previousSentence,
    updateSettings,
    getVoicesForLanguage,
  };
}

export type UseTTSReturn = ReturnType<typeof useTTS>;
