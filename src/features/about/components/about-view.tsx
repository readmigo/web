'use client';

import { Info, Hammer, Star, MessageSquareWarning, FileText, Users, BookOpen, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChangelogSection } from './changelog-section';
import { LicensesRow } from './licenses-dialog';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const APP_BUILD = process.env.NEXT_PUBLIC_APP_BUILD || '1';

export function AboutView() {
  const t = useTranslations('about');

  return (
    <div className="space-y-6">
      {/* App Header */}
      <div className="flex flex-col items-center py-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-3xl">📚</span>
        </div>
        <p className="mt-3 text-lg font-semibold">Readmigo</p>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      {/* Version Info */}
      <div className="rounded-xl border divide-y">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{t('version')}</span>
          </div>
          <span className="text-sm text-muted-foreground">{APP_VERSION}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Hammer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{t('buildNumber')}</span>
          </div>
          <span className="text-sm text-muted-foreground">{APP_BUILD}</span>
        </div>
      </div>

      {/* G10: Changelog */}
      <ChangelogSection />

      {/* Feedback */}
      <div className="rounded-xl border divide-y">
        <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">{t('feedback')}</p>
        <a
          href="https://apps.apple.com/app/readmigo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">{t('rateApp')}</span>
        </a>
        <a
          href="mailto:support@readmigo.app?subject=Feedback"
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t('reportProblem')}</span>
        </a>
      </div>

      {/* More */}
      <div className="rounded-xl border divide-y">
        <a
          href="https://readmigo.app/privacy?utm_source=web_app&utm_medium=app_link&utm_campaign=legal"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t('privacyPolicy')}</span>
        </a>
        <a
          href="https://readmigo.app/terms?utm_source=web_app&utm_medium=app_link&utm_campaign=legal"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t('termsOfService')}</span>
        </a>
        {/* G11: Open Source Licenses */}
        <LicensesRow />
      </div>

      {/* G12: Acknowledgments */}
      <div className="rounded-xl border divide-y">
        <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
          {t('acknowledgments.title')}
        </p>

        {/* Team */}
        <div className="px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {t('acknowledgments.teamTitle')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{t('acknowledgments.team')}</p>
        </div>

        {/* Content Sources */}
        <div className="px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {t('acknowledgments.contentTitle')}
            </span>
          </div>
          <ul className="space-y-1">
            {(['content1', 'content2', 'content3'] as const).map((key) => (
              <li key={key} className="text-sm text-muted-foreground flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                {t(`acknowledgments.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        {/* Special Thanks */}
        <div className="px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Heart className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {t('acknowledgments.specialTitle')}
            </span>
          </div>
          <ul className="space-y-1">
            {(['special1', 'special2', 'special3'] as const).map((key) => (
              <li key={key} className="text-sm text-muted-foreground flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                {t(`acknowledgments.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center py-6 text-xs text-muted-foreground">
        <p>{t('copyright')}</p>
        <p className="mt-1">{t('madeWith')}</p>
      </div>
    </div>
  );
}
