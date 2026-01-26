import { Metadata } from 'next';
import { VocabularyContent } from './vocabulary-content';

export const metadata: Metadata = {
  title: '生词本',
  description: '管理你的学习词汇',
};

export default function VocabularyPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">生词本</h1>
        <p className="text-muted-foreground">管理你在阅读中收集的生词</p>
      </div>
      <VocabularyContent />
    </div>
  );
}
