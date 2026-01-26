import { Metadata } from 'next';
import { ReaderContent } from './reader-content';

interface ReaderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ReaderPageProps): Promise<Metadata> {
  const { id } = await params;
  // TODO: Fetch book data for metadata
  return {
    title: '阅读中',
    description: '沉浸式阅读体验',
  };
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { id } = await params;

  return <ReaderContent bookId={id} />;
}
