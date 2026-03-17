'use client';

import { useState } from 'react';
import { Package, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LICENSES } from '../data/licenses';

interface LicensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LicensesDialog({ open, onOpenChange }: LicensesDialogProps) {
  const t = useTranslations('about');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('licenses.title')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          {t('licenses.desc')}
        </p>
        <div className="flex-1 overflow-y-auto divide-y rounded-lg border mt-2">
          {LICENSES.map((lib) => (
            <a
              key={lib.name}
              href={lib.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{lib.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{lib.version}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground">{lib.license}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LicensesRow() {
  const t = useTranslations('about');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(true)}
      >
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{t('licenses.label')}</span>
      </button>
      <LicensesDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
