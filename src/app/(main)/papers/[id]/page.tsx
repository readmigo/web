import { Metadata } from 'next';
import { PaperReader } from './paper-reader';

interface PaperPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PaperPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `论文阅读 - ${id}`,
    description: '阅读论文',
  };
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { id } = await params;
  return <PaperReader paperId={id} />;
}
