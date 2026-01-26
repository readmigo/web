import { Metadata } from 'next';
import { CommunityContent } from './community-content';

export const metadata: Metadata = {
  title: '资讯社区',
  description: '发现全球科技、商业、文化、文学资讯',
};

export default function CommunityPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">资讯社区</h1>
        <p className="text-muted-foreground">
          发现全球科技、商业、文化、文学资讯，边阅读边学英语
        </p>
      </div>
      <CommunityContent />
    </div>
  );
}
