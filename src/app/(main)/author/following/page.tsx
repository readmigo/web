import type { Metadata } from 'next';
import { FollowingAuthorsContent } from './following-content';

export const metadata: Metadata = {
  title: 'Following Authors - Readmigo',
  description: 'Authors you are following',
};

export default function FollowingAuthorsPage() {
  return <FollowingAuthorsContent />;
}
