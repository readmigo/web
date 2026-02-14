import { Metadata } from 'next';
import { BookListDetailContent } from './book-list-detail-content';

interface BookListPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BookListPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Book List',
    description: 'Browse curated book collections',
  };
}

export default async function BookListPage({ params }: BookListPageProps) {
  const { id } = await params;

  return <BookListDetailContent listId={id} />;
}
