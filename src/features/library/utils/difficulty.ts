/**
 * Convert difficultyScore (0-10 scale from API) to difficulty level (1-5).
 */
export function getDifficultyLevel(score: number | null | undefined): number | null {
  if (score == null || score <= 0) return null;
  if (score <= 2) return 1; // Beginner
  if (score <= 4) return 2; // Elementary
  if (score <= 6) return 3; // Intermediate
  if (score <= 8) return 4; // Advanced
  return 5; // Expert
}

export const difficultyLabels = [
  '',
  'Beginner',
  'Elementary',
  'Intermediate',
  'Advanced',
  'Expert',
];

export const difficultyColors = [
  '',
  'bg-green-500',
  'bg-blue-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
];

/** Dot colors for inline difficulty indicator (matching iOS colored circle style) */
export const difficultyDotColors = [
  '',
  'bg-green-500',
  'bg-blue-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
];
