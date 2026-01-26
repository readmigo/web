import { Metadata } from 'next';
import { BookDetailContent } from './book-detail-content';

interface BookPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { id } = await params;
  // TODO: Fetch book data for metadata
  return {
    title: '书籍详情',
    description: '查看书籍详情和开始阅读',
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;

  return <BookDetailContent bookId={id} />;
}
