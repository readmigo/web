import { Metadata } from 'next';
import { ArticleReader } from './article-reader';

export const metadata: Metadata = {
  title: '文章阅读',
  description: '阅读文章，学习英语',
};

export default function ArticlePage({ params }: { params: { id: string } }) {
  return <ArticleReader articleId={params.id} />;
}
