import { Metadata } from 'next';
import { CommunityContent } from './community-content';

export const metadata: Metadata = {
  title: '城邦',
  description: '阅读社区，分享阅读心得与书摘',
};

export default function CommunityPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">城邦</h1>
        <p className="text-muted-foreground">
          分享阅读心得，发现精彩书摘
        </p>
      </div>
      <CommunityContent />
    </div>
  );
}
