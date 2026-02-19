'use client';

import { useState, useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognitionClass(): (new () => any) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && getSpeechRecognitionClass() !== null;

  const startRecording = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      setError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[0][0];
      setTranscript(result.transcript);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setError(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript('');
    setError(null);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}

/**
 * Calculates pronunciation accuracy by comparing original text with spoken transcript.
 * Uses word-level alignment with lookahead for minor ordering differences.
 */
export function calculateAccuracy(
  original: string,
  spoken: string
): {
  accuracy: number;
  words: Array<{ word: string; status: 'correct' | 'incorrect' | 'missed' }>;
} {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean);

  const originalWords = normalize(original);
  const spokenWords = normalize(spoken);

  const results: Array<{ word: string; status: 'correct' | 'incorrect' | 'missed' }> = [];
  let correctCount = 0;
  let spokenIdx = 0;

  for (const origWord of originalWords) {
    if (spokenIdx < spokenWords.length && spokenWords[spokenIdx] === origWord) {
      results.push({ word: origWord, status: 'correct' });
      correctCount++;
      spokenIdx++;
    } else {
      // Look ahead up to 3 words for a match
      const lookahead = spokenWords.slice(spokenIdx, spokenIdx + 3);
      const found = lookahead.indexOf(origWord);
      if (found >= 0) {
        for (let i = 0; i < found; i++) {
          spokenIdx++;
        }
        results.push({ word: origWord, status: 'correct' });
        correctCount++;
        spokenIdx++;
      } else {
        results.push({ word: origWord, status: 'missed' });
      }
    }
  }

  return {
    accuracy: originalWords.length > 0 ? correctCount / originalWords.length : 0,
    words: results,
  };
}
