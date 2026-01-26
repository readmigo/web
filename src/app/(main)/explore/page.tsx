import { Metadata } from 'next';
import { ExploreContent } from './explore-content';

export const metadata: Metadata = {
  title: '探索',
  description: '发现超过 100,000 本免费英文原版书籍',
};

export default function ExplorePage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">探索书籍</h1>
        <p className="text-muted-foreground">
          发现超过 100,000 本免费英文原版书籍
        </p>
      </div>
      <ExploreContent />
    </div>
  );
}
