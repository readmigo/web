'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSpeechRecognition, calculateAccuracy } from '../hooks/use-speech-recognition';

interface PronunciationPracticeProps {
  sentences: string[];
  currentSentenceIndex: number;
  onSentenceChange: (index: number) => void;
}

export function PronunciationPractice({
  sentences,
  currentSentenceIndex,
  onSentenceChange,
}: PronunciationPracticeProps) {
  const t = useTranslations('audiobooks');
  const {
    isSupported,
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    reset,
  } = useSpeechRecognition();
  const [showResult, setShowResult] = useState(false);

  const currentSentence = sentences[currentSentenceIndex] || '';

  const result = useMemo(() => {
    if (!transcript || !currentSentence) return null;
    return calculateAccuracy(currentSentence, transcript);
  }, [transcript, currentSentence]);

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
      setShowResult(true);
    } else {
      setShowResult(false);
      reset();
      startRecording();
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    reset();
  };

  const handleNext = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      onSentenceChange(currentSentenceIndex + 1);
      handleTryAgain();
    }
  };

  const handlePrev = () => {
    if (currentSentenceIndex > 0) {
      onSentenceChange(currentSentenceIndex - 1);
      handleTryAgain();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        {t('speechNotSupported')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current sentence */}
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground mb-1">{t('originalText')}</p>
        <p className="text-base leading-relaxed">{currentSentence}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentSentenceIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          size="lg"
          onClick={handleRecord}
          className={isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
        >
          {isRecording ? (
            <>
              <MicOff className="mr-2 h-5 w-5" />
              {t('stopRecording')}
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              {t('startRecording')}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentSentenceIndex >= sentences.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Sentence counter */}
      <p className="text-center text-xs text-muted-foreground">
        {currentSentenceIndex + 1} / {sentences.length}
      </p>

      {/* Result */}
      {showResult && result && (
        <div className="rounded-lg border p-4 space-y-3">
          {/* Accuracy */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t('accuracy')}</p>
            <p
              className={`text-3xl font-bold ${
                result.accuracy >= 0.8
                  ? 'text-green-500'
                  : result.accuracy >= 0.5
                    ? 'text-yellow-500'
                    : 'text-red-500'
              }`}
            >
              {Math.round(result.accuracy * 100)}%
            </p>
          </div>

          {/* Word comparison */}
          <div className="flex flex-wrap gap-1">
            {result.words.map((w, i) => (
              <span
                key={i}
                className={`rounded px-1.5 py-0.5 text-sm ${
                  w.status === 'correct'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                {w.word}
              </span>
            ))}
          </div>

          {/* Transcript */}
          {transcript && (
            <div>
              <p className="text-xs text-muted-foreground">{t('yourSpeech')}</p>
              <p className="text-sm italic mt-0.5">{transcript}</p>
            </div>
          )}

          {/* Try again */}
          <Button variant="outline" className="w-full" onClick={handleTryAgain}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('tryAgain')}
          </Button>
        </div>
      )}
    </div>
  );
}
