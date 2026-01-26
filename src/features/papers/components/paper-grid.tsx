'use client';

import { PaperCard } from './paper-card';
import type { Paper } from '../types';

interface PaperGridProps {
  papers: Paper[];
  onDelete?: (id: string) => void;
}

export function PaperGrid({ papers, onDelete }: PaperGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {papers.map((paper) => (
        <PaperCard key={paper.id} paper={paper} onDelete={onDelete} />
      ))}
    </div>
  );
}
