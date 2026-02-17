import { Metadata } from 'next';
import { AudiobookDetailContent } from './audiobook-detail-content';

interface AudiobookPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AudiobookPageProps): Promise<Metadata> {
  // TODO: Fetch audiobook data for metadata
  void (await params);
  return {
    title: '有声书播放',
    description: '收听有声书',
  };
}

export default async function AudiobookPage({ params }: AudiobookPageProps) {
  const { id } = await params;

  return <AudiobookDetailContent audiobookId={id} />;
}
