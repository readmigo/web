import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CategoryContent } from './category-content';

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  await params;
  const t = await getTranslations('metadata');
  return {
    title: t('bookstoreTitle'),
    description: t('bookstoreDescription'),
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
