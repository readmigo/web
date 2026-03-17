'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTicket } from '../hooks/use-messages';

const CATEGORIES = [
  'bug',
  'feature_request',
  'ui_ux',
  'content',
  'performance',
  'other',
] as const;

type Category = (typeof CATEGORIES)[number];

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDeviceInfo(): string {
  return [
    `Browser: ${navigator.userAgent}`,
    `Language: ${navigator.language}`,
    `Screen: ${window.screen.width}x${window.screen.height}`,
  ].join('\n');
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
  const t = useTranslations('messaging.createTicket');

  const [category, setCategory] = useState<Category | ''>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachDeviceInfo, setAttachDeviceInfo] = useState(true);

  const createTicket = useCreateTicket();

  const isValid = category !== '' && subject.trim() !== '' && content.trim() !== '';

  function resetForm() {
    setCategory('');
    setSubject('');
    setContent('');
    setAttachDeviceInfo(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    if (!isValid || createTicket.isPending) return;

    const finalContent = attachDeviceInfo
      ? `${content.trim()}\n\n---\n${getDeviceInfo()}`
      : content.trim();

    createTicket.mutate(
      { subject: subject.trim(), category, content: finalContent },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-category">{t('category')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger id="ticket-category">
                <SelectValue placeholder={t('categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`categories.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-subject">{t('subject')}</Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('subjectPlaceholder')}
              maxLength={120}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-content">{t('content')}</Label>
            <textarea
              id="ticket-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('contentPlaceholder')}
              rows={5}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Device info toggle */}
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <button
              type="button"
              role="switch"
              aria-checked={attachDeviceInfo}
              onClick={() => setAttachDeviceInfo((v) => !v)}
              className={[
                'relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                attachDeviceInfo ? 'bg-primary' : 'bg-input',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                  attachDeviceInfo ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none">{t('deviceInfo')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('deviceInfoDesc')}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={createTicket.isPending}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || createTicket.isPending}>
            {createTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {createTicket.isPending ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
