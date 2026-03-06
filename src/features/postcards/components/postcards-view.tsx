'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Image as ImageIcon,
  Trash2,
  Share2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Check,
  Loader2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  usePostcards,
  usePostcardTemplates,
  useCreatePostcard,
  useDeletePostcard,
} from '../hooks/use-postcards';
import type {
  PostcardTemplate,
  PostcardDraft,
  TemplateCategory,
} from '../types';
import { FONT_OPTIONS, COLOR_PRESETS } from '../types';

// ─── Postcard Preview Card ─────────────────────────────────

function PostcardCard({
  text,
  bgColor,
  textColor,
  fontFamily,
  author,
}: {
  text: string;
  bgColor: string;
  textColor: string;
  fontFamily?: string;
  author?: string;
}) {
  return (
    <div
      className="flex aspect-[3/4] flex-col items-center justify-center rounded-xl p-5 text-center shadow-sm border"
      style={{ backgroundColor: bgColor, color: textColor, fontFamily: fontFamily || 'inherit' }}
    >
      <p className="text-sm leading-relaxed line-clamp-6">&ldquo;{text}&rdquo;</p>
      {author && <p className="mt-3 text-[10px] opacity-70">— {author}</p>}
    </div>
  );
}

// ─── Editor Steps ──────────────────────────────────────────

const CATEGORY_ALL = 'ALL' as const;

function TemplateStep({
  templates,
  draft,
  onSelect,
}: {
  templates: PostcardTemplate[];
  draft: PostcardDraft;
  onSelect: (t: PostcardTemplate) => void;
}) {
  const t = useTranslations('postcards');
  const [category, setCategory] = useState<TemplateCategory | typeof CATEGORY_ALL>(CATEGORY_ALL);

  const categories = [CATEGORY_ALL, ...new Set(templates.map((t) => t.category).filter(Boolean))] as (
    | TemplateCategory
    | typeof CATEGORY_ALL
  )[];

  const filtered = category === CATEGORY_ALL ? templates : templates.filter((t) => t.category === category);

  return (
    <div>
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs border transition-colors',
              cat === category ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {cat === CATEGORY_ALL ? t('allTemplates') : cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {filtered.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => !tmpl.isPremium && onSelect(tmpl)}
            className={cn(
              'relative rounded-lg overflow-hidden border-2 transition-all',
              draft.templateId === tmpl.id ? 'border-primary ring-2 ring-primary/30' : 'border-transparent',
              tmpl.isPremium && 'opacity-60',
            )}
          >
            <div
              className="aspect-[3/4] flex items-center justify-center p-2"
              style={{ backgroundColor: tmpl.backgroundColor, color: tmpl.fontColor }}
            >
              <span className="text-[10px] leading-tight text-center">{tmpl.name}</span>
            </div>
            {draft.templateId === tmpl.id && (
              <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            {tmpl.isPremium && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Badge variant="secondary" className="text-[10px]">
                  <Lock className="mr-1 h-3 w-3" />
                  Pro
                </Badge>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContentStep({
  draft,
  onChange,
}: {
  draft: PostcardDraft;
  onChange: (text: string) => void;
}) {
  const t = useTranslations('postcards');
  const text = draft.customText || '';

  return (
    <div>
      <p className="text-sm font-medium mb-2">{t('yourText')}</p>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value.slice(0, 280))}
        placeholder={t('textPlaceholder')}
        className="w-full min-h-[120px] rounded-lg border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        maxLength={280}
      />
      <p className="mt-1 text-right text-xs text-muted-foreground">{text.length}/280</p>
    </div>
  );
}

function StyleStep({
  draft,
  onChangeBg,
  onChangeText,
  onChangeFont,
}: {
  draft: PostcardDraft;
  onChangeBg: (c: string) => void;
  onChangeText: (c: string) => void;
  onChangeFont: (f: string) => void;
}) {
  const t = useTranslations('postcards');

  return (
    <div className="space-y-5">
      {/* Background color */}
      <div>
        <p className="text-sm font-medium mb-2">{t('backgroundColor')}</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => onChangeBg(c)}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-all',
                draft.backgroundColor === c ? 'border-primary scale-110' : 'border-muted',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Text color */}
      <div>
        <p className="text-sm font-medium mb-2">{t('textColor')}</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => onChangeText(c)}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-all',
                draft.textColor === c ? 'border-primary scale-110' : 'border-muted',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Font */}
      <div>
        <p className="text-sm font-medium mb-2">{t('font')}</p>
        <div className="flex gap-2">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChangeFont(f.value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                draft.fontFamily === f.value ? 'border-primary bg-primary/10' : 'hover:bg-muted',
              )}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewStep({ draft }: { draft: PostcardDraft }) {
  const t = useTranslations('postcards');

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-medium mb-3">{t('preview')}</p>
      <div className="w-56">
        <PostcardCard
          text={draft.customText || t('sampleText')}
          bgColor={draft.backgroundColor || draft.template?.backgroundColor || '#FFFFFF'}
          textColor={draft.textColor || draft.template?.fontColor || '#333333'}
          fontFamily={draft.fontFamily || draft.template?.fontFamily}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {t('template')}: {draft.template?.name || '—'}
      </p>
    </div>
  );
}

// ─── Main View ──────────────────────────────────────────────

const STEPS = ['template', 'content', 'style', 'preview'] as const;

export function PostcardsView() {
  const t = useTranslations('postcards');
  const [showEditor, setShowEditor] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<PostcardDraft>({ isPublic: false });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePostcards();
  const { data: templates = [] } = usePostcardTemplates();
  const createMutation = useCreatePostcard();
  const deleteMutation = useDeletePostcard();

  const postcards = data?.pages.flatMap((p) => p.postcards) || [];

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(handleObserver, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [handleObserver]);

  const handleCreate = async () => {
    if (!draft.templateId || !draft.customText?.trim()) return;
    await createMutation.mutateAsync({
      templateId: draft.templateId,
      customText: draft.customText,
      backgroundColor: draft.backgroundColor,
      textColor: draft.textColor,
      fontFamily: draft.fontFamily,
      isPublic: draft.isPublic,
    });
    setShowEditor(false);
    setDraft({ isPublic: false });
    setStep(0);
  };

  // ─── Editor View ─────
  if (showEditor) {
    return (
      <div>
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setShowEditor(false); setStep(0); }}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t('cancel')}
          </Button>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn('h-1.5 w-6 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{step + 1}/{STEPS.length}</span>
        </div>

        {/* Step content */}
        {step === 0 && (
          <TemplateStep
            templates={templates}
            draft={draft}
            onSelect={(tmpl) => setDraft((d) => ({ ...d, templateId: tmpl.id, template: tmpl, backgroundColor: tmpl.backgroundColor, textColor: tmpl.fontColor, fontFamily: tmpl.fontFamily }))}
          />
        )}
        {step === 1 && <ContentStep draft={draft} onChange={(text) => setDraft((d) => ({ ...d, customText: text }))} />}
        {step === 2 && (
          <StyleStep
            draft={draft}
            onChangeBg={(c) => setDraft((d) => ({ ...d, backgroundColor: c }))}
            onChangeText={(c) => setDraft((d) => ({ ...d, textColor: c }))}
            onChangeFont={(f) => setDraft((d) => ({ ...d, fontFamily: f }))}
          />
        )}
        {step === 3 && <PreviewStep draft={draft} />}

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              {t('back')}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="flex-1"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !draft.templateId}
            >
              {t('next')}
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={createMutation.isPending || !draft.customText?.trim()}
            >
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('create')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── Loading ─────
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
        ))}
      </div>
    );
  }

  // ─── Empty ─────
  if (postcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ImageIcon className="h-12 w-12 opacity-30" />
        <p className="mt-3 text-sm">{t('empty')}</p>
        <Button className="mt-4" size="sm" onClick={() => setShowEditor(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('createNew')}
        </Button>
      </div>
    );
  }

  // ─── Gallery ─────
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {postcards.length} {t('postcards')}
        </p>
        <Button size="sm" onClick={() => setShowEditor(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('createNew')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {postcards.map((card) => (
          <div key={card.id} className="group relative">
            <PostcardCard
              text={card.customText || card.quote?.text || ''}
              bgColor={card.backgroundColor || '#FFFFFF'}
              textColor={card.textColor || '#333333'}
              fontFamily={card.fontFamily}
              author={card.quote?.author}
            />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-muted-foreground bg-background/80 rounded px-1.5 py-0.5">
                {new Date(card.createdAt).toLocaleDateString()}
              </span>
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6"
                onClick={() => deleteMutation.mutate(card.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
