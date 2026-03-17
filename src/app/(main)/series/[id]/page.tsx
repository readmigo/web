import type { Metadata } from 'next';
import { SeriesDetailContent } from './series-detail-content';

interface SeriesPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { id } = await params;
  void id;
  return {
    title: 'Series - Readmigo',
    description: 'Explore all books in this series',
  };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { id } = await params;
  return (
    <div className="container py-6">
      <SeriesDetailContent seriesId={id} />
    </div>
  );
}
