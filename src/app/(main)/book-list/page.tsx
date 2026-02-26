import { Metadata } from 'next';
import { BookListsContent } from './book-lists-content';

export const metadata: Metadata = {
  title: 'Book Lists',
  description: 'Browse all curated book collections',
};

export default function BookListsPage() {
  return <BookListsContent />;
}
