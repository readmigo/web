import { Metadata } from 'next';
import { ArticleReader } from './article-reader';

export const metadata: Metadata = {
  title: '文章阅读',
  description: '阅读文章，学习英语',
};

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleReader articleId={id} />;
}
