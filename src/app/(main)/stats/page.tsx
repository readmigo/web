import { Metadata } from 'next';
import { ReadingStatsDashboard } from '@/features/stats/components/reading-stats-dashboard';

export const metadata: Metadata = {
  title: 'Reading Stats',
  description: 'Your reading activity by session type — text, TTS, and audiobook.',
};

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold">Reading Stats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your reading activity across all session types
        </p>
      </div>
      <ReadingStatsDashboard />
    </div>
  );
}
