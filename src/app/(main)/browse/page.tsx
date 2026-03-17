import type { Metadata } from 'next';
import { BrowseContent } from './browse-content';

export const metadata: Metadata = {
  title: 'Browse Books - Readmigo',
  description: 'Browse all books with difficulty, category, and sort filters',
};

export default function BrowsePage() {
  return (
    <div className="container py-6">
      <BrowseContent />
    </div>
  );
}
