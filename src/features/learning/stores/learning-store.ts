import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  VocabularyWord,
  FlashCard,
  SM2Data,
  ReviewQuality,
  LearningStats,
} from '../types';

interface LearningState {
  vocabulary: VocabularyWord[];
  sm2Data: Record<string, SM2Data>;
  currentSession: {
    cards: FlashCard[];
    currentIndex: number;
    correctCount: number;
    startTime: Date | null;
  } | null;
}

interface LearningActions {
  // Vocabulary
  addWord: (word: Omit<VocabularyWord, 'id' | 'addedAt' | 'masteryLevel'>) => void;
  removeWord: (wordId: string) => void;
  updateWord: (wordId: string, updates: Partial<VocabularyWord>) => void;

  // Review Session
  startReviewSession: () => void;
  submitReview: (wordId: string, quality: ReviewQuality) => void;
  endSession: () => void;
  nextCard: () => void;

  // Stats
  getStats: () => LearningStats;
  getDueCards: () => FlashCard[];
}

// SM-2 Algorithm implementation
function calculateSM2(
  currentData: SM2Data,
  quality: ReviewQuality
): SM2Data {
  let { easeFactor, interval, repetitions } = currentData;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response - reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    ...currentData,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastReviewDate: new Date(),
  };
}

function getMasteryLevel(sm2Data: SM2Data): 0 | 1 | 2 | 3 | 4 | 5 {
  const { repetitions, easeFactor } = sm2Data;
  if (repetitions === 0) return 0;
  if (repetitions === 1) return 1;
  if (repetitions <= 3) return 2;
  if (repetitions <= 5) return 3;
  if (easeFactor >= 2.5 && repetitions > 5) return 5;
  return 4;
}

export const useLearningStore = create<LearningState & LearningActions>()(
  persist(
    (set, get) => ({
      vocabulary: [],
      sm2Data: {},
      currentSession: null,

      addWord: (wordData) => {
        const id = crypto.randomUUID();
        const newWord: VocabularyWord = {
          ...wordData,
          id,
          addedAt: new Date(),
          masteryLevel: 0,
        };

        const initialSM2: SM2Data = {
          wordId: id,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewDate: new Date(),
        };

        set((state) => ({
          vocabulary: [...state.vocabulary, newWord],
          sm2Data: { ...state.sm2Data, [id]: initialSM2 },
        }));
      },

      removeWord: (wordId) => {
        set((state) => {
          const { [wordId]: _, ...restSM2 } = state.sm2Data;
          return {
            vocabulary: state.vocabulary.filter((w) => w.id !== wordId),
            sm2Data: restSM2,
          };
        });
      },

      updateWord: (wordId, updates) => {
        set((state) => ({
          vocabulary: state.vocabulary.map((w) =>
            w.id === wordId ? { ...w, ...updates } : w
          ),
        }));
      },

      startReviewSession: () => {
        const dueCards = get().getDueCards();
        if (dueCards.length === 0) {
          set({ currentSession: null });
          return;
        }

        // Shuffle cards
        const shuffled = [...dueCards].sort(() => Math.random() - 0.5);

        set({
          currentSession: {
            cards: shuffled.slice(0, 20), // Max 20 cards per session
            currentIndex: 0,
            correctCount: 0,
            startTime: new Date(),
          },
        });
      },

      submitReview: (wordId, quality) => {
        const { sm2Data, vocabulary, currentSession } = get();
        const currentData = sm2Data[wordId];

        if (!currentData) return;

        const newSM2Data = calculateSM2(currentData, quality);
        const newMastery = getMasteryLevel(newSM2Data);

        set((state) => ({
          sm2Data: { ...state.sm2Data, [wordId]: newSM2Data },
          vocabulary: state.vocabulary.map((w) =>
            w.id === wordId ? { ...w, masteryLevel: newMastery } : w
          ),
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                correctCount:
                  quality >= 3
                    ? state.currentSession.correctCount + 1
                    : state.currentSession.correctCount,
              }
            : null,
        }));
      },

      nextCard: () => {
        set((state) => {
          if (!state.currentSession) return state;

          const nextIndex = state.currentSession.currentIndex + 1;
          if (nextIndex >= state.currentSession.cards.length) {
            // Session complete
            return { currentSession: null };
          }

          return {
            currentSession: {
              ...state.currentSession,
              currentIndex: nextIndex,
            },
          };
        });
      },

      endSession: () => {
        set({ currentSession: null });
      },

      getStats: () => {
        const { vocabulary, sm2Data } = get();
        const now = new Date();

        const masteredWords = vocabulary.filter((w) => w.masteryLevel >= 4).length;
        const learningWords = vocabulary.filter(
          (w) => w.masteryLevel > 0 && w.masteryLevel < 4
        ).length;
        const newWords = vocabulary.filter((w) => w.masteryLevel === 0).length;

        const reviewsDueToday = Object.values(sm2Data).filter(
          (data) => new Date(data.nextReviewDate) <= now
        ).length;

        return {
          totalWords: vocabulary.length,
          masteredWords,
          learningWords,
          newWords,
          reviewsDueToday,
          streakDays: 0, // TODO: Calculate from daily progress
          totalReviews: Object.values(sm2Data).reduce(
            (sum, data) => sum + data.repetitions,
            0
          ),
          averageAccuracy: 0, // TODO: Calculate from review history
        };
      },

      getDueCards: () => {
        const { vocabulary, sm2Data } = get();
        const now = new Date();

        return vocabulary
          .filter((word) => {
            const data = sm2Data[word.id];
            if (!data) return true; // New word, never reviewed
            return new Date(data.nextReviewDate) <= now;
          })
          .map((word) => ({
            id: word.id,
            word,
            sm2Data: sm2Data[word.id] || {
              wordId: word.id,
              easeFactor: 2.5,
              interval: 0,
              repetitions: 0,
              nextReviewDate: new Date(),
            },
          }));
      },
    }),
    {
      name: 'learning-storage',
    }
  )
);
