export interface VocabularyWord {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  translation: string;
  examples: string[];
  bookId?: string;
  bookTitle?: string;
  context?: string; // The sentence where word was found
  addedAt: Date;
  masteryLevel: 0 | 1 | 2 | 3 | 4 | 5; // 0 = new, 5 = mastered
}

// SM-2 Spaced Repetition Algorithm types
export interface SM2Data {
  wordId: string;
  easeFactor: number; // E-Factor (2.5 default)
  interval: number; // Days until next review
  repetitions: number; // Number of successful reviews
  nextReviewDate: Date;
  lastReviewDate?: Date;
}

export interface FlashCard {
  id: string;
  word: VocabularyWord;
  sm2Data: SM2Data;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 - Complete blackout
// 1 - Incorrect, but remembered after seeing answer
// 2 - Incorrect, but easy to recall after seeing answer
// 3 - Correct with serious difficulty
// 4 - Correct with hesitation
// 5 - Perfect response

export interface ReviewSession {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  cardsReviewed: number;
  cardsCorrect: number;
  duration: number; // in seconds
}

export interface LearningStats {
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  newWords: number;
  reviewsDueToday: number;
  streakDays: number;
  totalReviews: number;
  averageAccuracy: number;
}

export interface DailyProgress {
  date: string;
  wordsLearned: number;
  wordsReviewed: number;
  minutesSpent: number;
}
