'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { User, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

interface ProfileData {
  gender: Gender | '';
  birthYear: string;
  country: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: CURRENT_YEAR - 1900 - 13 }, (_, i) =>
  String(CURRENT_YEAR - 14 - i)
);

// ISO 3166-1 alpha-2 country list (abbreviated for brevity — top regions first)
const COUNTRIES: [string, string][] = [
  ['CN', 'China'],
  ['US', 'United States'],
  ['GB', 'United Kingdom'],
  ['CA', 'Canada'],
  ['AU', 'Australia'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['JP', 'Japan'],
  ['KR', 'South Korea'],
  ['TW', 'Taiwan'],
  ['HK', 'Hong Kong'],
  ['SG', 'Singapore'],
  ['IN', 'India'],
  ['BR', 'Brazil'],
  ['MX', 'Mexico'],
  ['RU', 'Russia'],
  ['ES', 'Spain'],
  ['IT', 'Italy'],
  ['PT', 'Portugal'],
  ['NL', 'Netherlands'],
  ['SE', 'Sweden'],
  ['NO', 'Norway'],
  ['DK', 'Denmark'],
  ['FI', 'Finland'],
  ['PL', 'Poland'],
  ['AR', 'Argentina'],
  ['CL', 'Chile'],
  ['CO', 'Colombia'],
  ['ID', 'Indonesia'],
  ['MY', 'Malaysia'],
  ['TH', 'Thailand'],
  ['VN', 'Vietnam'],
  ['PH', 'Philippines'],
  ['EG', 'Egypt'],
  ['SA', 'Saudi Arabia'],
  ['AE', 'United Arab Emirates'],
  ['TR', 'Turkey'],
  ['NG', 'Nigeria'],
  ['ZA', 'South Africa'],
  ['OTHER', 'Other'],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SelectField({
  id,
  label,
  value,
  onChange,
  placeholder,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileEditSection() {
  const t = useTranslations('settings.profile');

  const [profile, setProfile] = useState<ProfileData>({
    gender: '',
    birthYear: '',
    country: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedOk(false);
    setSaveError(null);

    const payload: Record<string, string> = {};
    if (profile.gender) payload.gender = profile.gender;
    if (profile.birthYear) payload.birthYear = profile.birthYear;
    if (profile.country) payload.country = profile.country;

    try {
      await apiClient.patch('/users/me', payload);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch {
      setSaveError(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = profile.gender !== '' || profile.birthYear !== '' || profile.country !== '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gender */}
        <SelectField
          id="gender"
          label={t('gender')}
          value={profile.gender}
          onChange={(v) => setProfile((p) => ({ ...p, gender: v as Gender }))}
          placeholder={t('genderPlaceholder')}
        >
          <option value="male">{t('genderMale')}</option>
          <option value="female">{t('genderFemale')}</option>
          <option value="other">{t('genderOther')}</option>
          <option value="prefer_not_to_say">{t('genderPreferNot')}</option>
        </SelectField>

        {/* Birth Year */}
        <SelectField
          id="birthYear"
          label={t('birthYear')}
          value={profile.birthYear}
          onChange={(v) => setProfile((p) => ({ ...p, birthYear: v }))}
          placeholder={t('birthYearPlaceholder')}
        >
          {BIRTH_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </SelectField>

        {/* Country */}
        <SelectField
          id="country"
          label={t('country')}
          value={profile.country}
          onChange={(v) => setProfile((p) => ({ ...p, country: v }))}
          placeholder={t('countryPlaceholder')}
        >
          {COUNTRIES.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </SelectField>

        {/* Save */}
        {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="w-full"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : savedOk ? (
            <Check className="mr-2 h-4 w-4" />
          ) : null}
          {savedOk ? t('saved') : t('save')}
        </Button>
      </CardContent>
    </Card>
  );
}
