import { Metadata } from 'next';
import { LearnContent } from './learn-content';

export const metadata: Metadata = {
  title: '学习',
  description: '复习生词，巩固记忆',
};

export default function LearnPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">学习中心</h1>
        <p className="text-muted-foreground">使用间隔重复算法高效记忆生词</p>
      </div>
      <LearnContent />
    </div>
  );
}
