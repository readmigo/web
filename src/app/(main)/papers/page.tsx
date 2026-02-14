import { Metadata } from 'next';
import { PapersContent } from './papers-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '论文库',
  description: '管理和阅读你的学术论文',
};

export default function PapersPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">论文库</h1>
        <p className="text-muted-foreground">浏览和阅读学术论文</p>
      </div>
      <PapersContent />
    </div>
  );
}
