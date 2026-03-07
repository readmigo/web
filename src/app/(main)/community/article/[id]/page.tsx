import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArticleReader } from './article-reader';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('learnTitle'),
    description: t('learnDescription'),
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleReader articleId={id} />;
}
