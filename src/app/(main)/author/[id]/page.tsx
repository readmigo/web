import type { Metadata } from 'next';
import { AuthorDetailContent } from './author-detail-content';

interface AuthorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  // TODO: Fetch author data for metadata
  return {
    title: `Author - Readmigo`,
    description: 'Explore author profile, works, and quotes',
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { id } = await params;
  return <AuthorDetailContent authorId={id} />;
}
