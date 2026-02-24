'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, Plus, Check, Volume2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useChapterText } from '../hooks/use-chapter-text';
import { useWhispersyncFromAudiobook } from '../hooks/use-whispersync';
import { useAudioPlayerStore } from '../stores/audio-player-store';
import { useLearningStore } from '@/features/learning/stores/learning-store';
import type { Audiobook } from '../types';

interface StudyModeViewProps {
  audiobook: Audiobook;
}

interface WordDefinition {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
}

function splitIntoSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  return sentences ? sentences.map((s) => s.trim()).filter(Boolean) : [text];
}

export function StudyModeView({ audiobook }: StudyModeViewProps) {
  const t = useTranslations('audiobooks');
  const containerRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const { chapterIndex, currentTime, duration } = useAudioPlayerStore();
  const { book, hasBook, getBookChapterId } = useWhispersyncFromAudiobook(audiobook);
  const vocabulary = useLearningStore((s) => s.vocabulary);
  const addWord = useLearningStore((s) => s.addWord);

  const bookChapterId = getBookChapterId(chapterIndex);
  const { data: chapterData, isLoading } = useChapterText(book?.id, bookChapterId);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDef, setWordDef] = useState<WordDefinition | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  // Build sentences from paragraphs
  const sentences = useMemo(() => {
    if (!chapterData?.paragraphs) return [];
    return chapterData.paragraphs.flatMap((p) => splitIntoSentences(p.text));
  }, [chapterData]);

  // Estimate current sentence based on audio position
  const currentSentenceIndex = useMemo(() => {
    if (sentences.length === 0 || duration <= 0) return 0;
    const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
    const progress = Math.min(1, currentTime / duration);
    const targetOffset = progress * totalChars;

    let accumulated = 0;
    for (let i = 0; i < sentences.length; i++) {
      accumulated += sentences[i].length;
      if (accumulated >= targetOffset) return i;
    }
    return sentences.length - 1;
  }, [sentences, currentTime, duration]);

  // Vocabulary set for quick lookup
  const vocabSet = useMemo(
    () => new Set(vocabulary.map((v) => v.word.toLowerCase())),
    [vocabulary]
  );

  // Auto-scroll to current sentence
  useEffect(() => {
    const el = sentenceRefs.current.get(currentSentenceIndex);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSentenceIndex]);

  // Look up word definition via free dictionary API
  const lookupWord = useCallback(async (word: string) => {
    setSelectedWord(word);
    setIsLookingUp(true);
    setWordDef(null);

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
      );
      if (res.ok) {
        const data = await res.json();
        const entry = data[0];
        const meaning = entry?.meanings?.[0];
        setWordDef({
          word: entry?.word || word,
          phonetic: entry?.phonetic || entry?.phonetics?.[0]?.text,
          partOfSpeech: meaning?.partOfSpeech,
          definition: meaning?.definitions?.[0]?.definition,
        });
      } else {
        setWordDef({ word });
      }
    } catch {
      setWordDef({ word });
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  // Add word to vocabulary
  const handleAddWord = () => {
    if (!wordDef) return;
    addWord({
      word: wordDef.word,
      phonetic: wordDef.phonetic,
      partOfSpeech: wordDef.partOfSpeech || 'unknown',
      definition: wordDef.definition || '',
      translation: '',
      examples: [],
      bookId: book?.id,
      bookTitle: audiobook.title,
    });
    setSelectedWord(null);
  };

  // Text-to-speech for a single word
  const speakWord = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  // --- Render states ---

  if (!hasBook || !bookChapterId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t('studyModeUnavailable')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t('chapterTextUnavailable')}
        </p>
      </div>
    );
  }

  // --- Main study view ---

  return (
    <div ref={containerRef} className="flex h-full flex-col">
      {/* Sticky header */}
      <div className="flex-shrink-0 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <p className="text-xs text-muted-foreground">{t('tapToLookup')}</p>
      </div>

      {/* Sentences */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {sentences.map((sentence, idx) => {
          const isCurrent = idx === currentSentenceIndex;
          const isPast = idx < currentSentenceIndex;
          const tokens = sentence.split(/(\s+)/);

          return (
            <div
              key={idx}
              ref={(el) => {
                if (el) sentenceRefs.current.set(idx, el);
              }}
              className={`rounded-md px-2 py-1.5 transition-all duration-300 ${
                isCurrent ? 'bg-primary/10' : isPast ? 'opacity-50' : ''
              }`}
            >
              {tokens.map((token, ti) => {
                // Whitespace tokens
                if (/^\s+$/.test(token)) return <span key={ti}>{token}</span>;

                const cleanWord = token
                  .replace(/[^a-zA-Z]/g, '')
                  .toLowerCase();
                const isInVocab = cleanWord.length >= 2 && vocabSet.has(cleanWord);
                const isSelected = selectedWord?.toLowerCase() === cleanWord;

                return (
                  <span
                    key={ti}
                    onClick={() =>
                      cleanWord.length >= 2 && lookupWord(cleanWord)
                    }
                    className={`cursor-pointer rounded px-0.5 text-sm leading-relaxed transition-colors ${
                      isSelected
                        ? 'bg-primary/20 text-primary font-medium'
                        : isInVocab
                          ? 'underline decoration-primary/40 decoration-dotted underline-offset-4'
                          : isCurrent
                            ? 'text-foreground hover:bg-primary/10'
                            : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {token}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Word definition panel */}
      {selectedWord && (
        <div className="flex-shrink-0 border-t bg-background p-4 shadow-lg">
          {isLookingUp ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('lookingUp')}
            </div>
          ) : wordDef ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{wordDef.word}</span>
                {wordDef.phonetic && (
                  <span className="text-sm text-muted-foreground">
                    {wordDef.phonetic}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => speakWord(wordDef.word)}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </Button>
                {wordDef.partOfSpeech && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {wordDef.partOfSpeech}
                  </span>
                )}
              </div>
              {wordDef.definition ? (
                <p className="text-sm">{wordDef.definition}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('noDefinitionFound')}
                </p>
              )}
              <div className="flex gap-2">
                {vocabSet.has(wordDef.word.toLowerCase()) ? (
                  <Button size="sm" variant="outline" disabled>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    {t('alreadyInVocabulary')}
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleAddWord}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {t('addToVocabulary')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedWord(null)}
                >
                  {t('close')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
