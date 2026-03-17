'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Globe, Lock } from 'lucide-react';

interface NoteInputDialogProps {
  open: boolean;
  selectedText: string;
  onSave: (note: string, isPublic: boolean) => void;
  onClose: () => void;
}

export function NoteInputDialog({ open, selectedText, onSave, onClose }: NoteInputDialogProps) {
  const t = useTranslations('reader');
  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = () => {
    if (!note.trim()) return;
    onSave(note.trim(), isPublic);
    setNote('');
    setIsPublic(false);
    onClose();
  };

  const handleClose = () => {
    setNote('');
    setIsPublic(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addNote')}</DialogTitle>
        </DialogHeader>

        {/* Selected text preview */}
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-sm text-muted-foreground line-clamp-3">
            <span aria-hidden="true">&ldquo;</span>
            {selectedText}
            <span aria-hidden="true">&rdquo;</span>
          </p>
        </div>

        {/* Note input */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('notePlaceholder')}
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          autoFocus
        />

        {/* Public toggle */}
        <button
          type="button"
          onClick={() => setIsPublic((prev) => !prev)}
          aria-pressed={isPublic}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted w-full text-left"
        >
          {isPublic ? (
            <Globe className="h-4 w-4 text-primary shrink-0" aria-hidden />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          )}
          <span className={isPublic ? 'text-primary font-medium' : 'text-muted-foreground'}>
            {isPublic ? t('sharePublicly') : t('keepPrivate')}
          </span>
        </button>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={!note.trim()}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
