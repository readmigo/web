import { Metadata } from 'next';
import { CategoryContent } from './category-content';

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `分类浏览 - ${id}`,
    description: '浏览该分类下的所有书籍',
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  return (
    <div className="container py-6">
      <CategoryContent categoryId={id} />
    </div>
  );
}
