'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ArrowLeft,
  Users,
  GraduationCap,
  BookOpen,
  Globe,
  Clock,
} from 'lucide-react';
import type { CivilizationMap, AuthorLink, HistoricalEvent, DomainPosition } from '../types';

interface CivilizationMapSectionProps {
  civilizationMap: CivilizationMap;
  authorName: string;
  authorEra?: string;
}

export function CivilizationMapSection({
  civilizationMap,
  authorName,
  authorEra,
}: CivilizationMapSectionProps) {
  const t = useTranslations('author');
  const { influences, literaryMovement, historicalPeriod, primaryGenres, themes, domains, historicalContext } = civilizationMap;

  return (
    <div className="space-y-6">
      {/* Literary Position */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('literaryCoordinates')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {literaryMovement && (
              <div>
                <p className="text-sm text-muted-foreground">{t('literaryGenre')}</p>
                <p className="font-medium">{literaryMovement}</p>
              </div>
            )}
            {historicalPeriod && (
              <div>
                <p className="text-sm text-muted-foreground">{t('historicalPeriod')}</p>
                <p className="font-medium">{historicalPeriod}</p>
              </div>
            )}
          </div>

          {primaryGenres && primaryGenres.length > 0 && (
            <div>
              <p className="mb-2 text-sm text-muted-foreground">{t('primaryGenresLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {primaryGenres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {themes && themes.length > 0 && (
            <div>
              <p className="mb-2 text-sm text-muted-foreground">{t('coreThemes')}</p>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme) => (
                  <Badge key={theme} variant="outline">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Influence Network */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('influenceNetwork')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Predecessors - Who influenced this author */}
          {influences.predecessors.length > 0 && (
            <InfluenceSection
              title={t('influencedBy')}
              subtitle={t('influencedByDesc')}
              authors={influences.predecessors}
              icon={<ArrowRight className="h-4 w-4 text-blue-500" />}
              direction="incoming"
            />
          )}

          {/* Current Author - Center */}
          <div className="flex items-center justify-center py-4">
            <div className="rounded-full border-2 border-primary bg-primary/10 px-6 py-3">
              <p className="text-center font-semibold">{authorName}</p>
              {authorEra && (
                <p className="text-center text-sm text-muted-foreground">
                  {authorEra}
                </p>
              )}
            </div>
          </div>

          {/* Successors - Who this author influenced */}
          {influences.successors.length > 0 && (
            <InfluenceSection
              title={t('influencedOthers')}
              subtitle={t('influencedOthersDesc')}
              authors={influences.successors}
              icon={<ArrowLeft className="h-4 w-4 text-green-500" />}
              direction="outgoing"
            />
          )}

          {/* Contemporaries */}
          {influences.contemporaries.length > 0 && (
            <InfluenceSection
              title={t('contemporaries')}
              subtitle={t('contemporariesDesc')}
              authors={influences.contemporaries}
              icon={<Users className="h-4 w-4 text-purple-500" />}
              direction="peer"
            />
          )}

          {/* Mentors */}
          {influences.mentors && influences.mentors.length > 0 && (
            <InfluenceSection
              title={t('mentors')}
              subtitle={t('mentorsDesc')}
              authors={influences.mentors}
              icon={<GraduationCap className="h-4 w-4 text-orange-500" />}
              direction="incoming"
            />
          )}

          {/* Students */}
          {influences.students && influences.students.length > 0 && (
            <InfluenceSection
              title={t('students')}
              subtitle={t('studentsDesc')}
              authors={influences.students}
              icon={<BookOpen className="h-4 w-4 text-teal-500" />}
              direction="outgoing"
            />
          )}
        </CardContent>
      </Card>

      {/* Cross-Domain Contributions */}
      {domains && domains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('crossDomainContributions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {domains.map((domain) => (
                <DomainItem key={domain.domain} domain={domain} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Context */}
      {historicalContext && historicalContext.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('historicalBackground')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0 pl-6">
              <div className="absolute left-2 top-2 h-[calc(100%-16px)] w-0.5 bg-border" />
              {historicalContext.map((event, index) => (
                <HistoricalEventItem key={index} event={event} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface InfluenceSectionProps {
  title: string;
  subtitle: string;
  authors: AuthorLink[];
  icon: React.ReactNode;
  direction: 'incoming' | 'outgoing' | 'peer';
}

function InfluenceSection({
  title,
  subtitle,
  authors,
  icon,
  direction,
}: InfluenceSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((author) => (
          <AuthorLinkCard key={author.id} author={author} />
        ))}
      </div>
    </div>
  );
}

function AuthorLinkCard({ author }: { author: AuthorLink }) {
  return (
    <Link href={`/author/${author.id}`}>
      <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
          {author.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={author.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-lg font-medium">
              {author.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{author.name}</p>
          {author.nameZh && (
            <p className="truncate text-sm text-muted-foreground">
              {author.nameZh}
            </p>
          )}
          {author.era && (
            <p className="text-xs text-muted-foreground">{author.era}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

interface DomainItemProps {
  domain: DomainPosition;
}

function DomainItem({ domain }: DomainItemProps) {
  const t = useTranslations('author');

  const significanceLabel =
    domain.significance === 'major'
      ? t('significanceMajor')
      : domain.significance === 'moderate'
        ? t('significanceModerate')
        : t('significanceMinor');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-medium capitalize">{domain.domain}</span>
        <Badge
          variant={
            domain.significance === 'major'
              ? 'default'
              : domain.significance === 'moderate'
                ? 'secondary'
                : 'outline'
          }
        >
          {significanceLabel}
        </Badge>
      </div>
      <ul className="list-inside list-disc text-sm text-muted-foreground">
        {domain.contributions.map((contribution, i) => (
          <li key={i}>{contribution}</li>
        ))}
      </ul>
    </div>
  );
}

const eventCategoryColors: Record<HistoricalEvent['category'], string> = {
  war: 'bg-red-500',
  revolution: 'bg-orange-500',
  cultural: 'bg-purple-500',
  political: 'bg-blue-500',
  scientific: 'bg-green-500',
};

function HistoricalEventItem({ event }: { event: HistoricalEvent }) {
  const t = useTranslations('author');

  const categoryLabels: Record<HistoricalEvent['category'], string> = {
    war: t('eventCategoryWar'),
    revolution: t('eventCategoryRevolution'),
    cultural: t('eventCategoryCultural'),
    political: t('eventCategoryPolitical'),
    scientific: t('eventCategoryScientific'),
  };

  return (
    <div className="relative pb-6 last:pb-0">
      <div
        className={`absolute -left-4 top-1 h-3 w-3 rounded-full border-2 border-background ${eventCategoryColors[event.category]}`}
      />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{event.year}</span>
          <Badge variant="outline" className="text-xs">
            {categoryLabels[event.category]}
          </Badge>
        </div>
        <p className="text-sm">{event.titleZh || event.title}</p>
      </div>
    </div>
  );
}
