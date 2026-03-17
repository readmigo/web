'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Zap, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CHANGELOG, type ChangeType } from '../data/changelog';

const TYPE_CONFIG: Record<ChangeType, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  new: { icon: Sparkles, className: 'text-emerald-500' },
  improved: { icon: Zap, className: 'text-blue-500' },
  fixed: { icon: Wrench, className: 'text-orange-500' },
};

export function ChangelogSection() {
  const t = useTranslations('about');
  const [openVersions, setOpenVersions] = useState<Set<string>>(
    new Set([CHANGELOG[0]?.version ?? ''])
  );

  function toggle(version: string) {
    setOpenVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  }

  return (
    <div className="rounded-xl border divide-y">
      <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
        {t('changelog.title')}
      </p>
      {CHANGELOG.map((entry) => {
        const isOpen = openVersions.has(entry.version);
        return (
          <div key={entry.version}>
            <button
              className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              onClick={() => toggle(entry.version)}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">v{entry.version}</span>
                <span className="text-xs text-muted-foreground">{entry.date}</span>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <ul className="px-4 pb-3 space-y-2">
                {entry.items.map((item) => {
                  const { icon: Icon, className } = TYPE_CONFIG[item.type];
                  return (
                    <li key={item.key} className="flex items-start gap-2">
                      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${className}`} />
                      <span className="text-sm text-muted-foreground">
                        {t(`changelog.items.${item.key}`)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
