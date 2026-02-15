import { Metadata } from 'next';
import { AudiobooksContent } from './audiobooks-content';

export const metadata: Metadata = {
  title: '有声书',
  description: '探索免费英文原版有声书',
};

export default function AudiobooksPage() {
  return (
    <div className="container py-6">
      <AudiobooksContent />
    </div>
  );
}
