import { Metadata } from 'next';
import { LibraryContent } from './library-content';

export const metadata: Metadata = {
  title: '我的书架',
  description: '管理你的阅读书籍',
};

export default function LibraryPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">我的书架</h1>
        <p className="text-muted-foreground">管理你的阅读书籍和进度</p>
      </div>
      <LibraryContent />
    </div>
  );
}
