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

interface NoteInputDialogProps {
  open: boolean;
  selectedText: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

export function NoteInputDialog({ open, selectedText, onSave, onClose }: NoteInputDialogProps) {
  const t = useTranslations('reader');
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!note.trim()) return;
    onSave(note.trim());
    setNote('');
    onClose();
  };

  const handleClose = () => {
    setNote('');
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

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={!note.trim()}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
