export type ChangeType = 'new' | 'improved' | 'fixed';

export interface ChangeItem {
  type: ChangeType;
  key: string; // i18n key suffix within about.changelog.items.*
}

export interface ChangelogVersion {
  version: string;
  date: string;
  items: ChangeItem[];
}

export const CHANGELOG: ChangelogVersion[] = [
  {
    version: '2.8.0',
    date: '2025-03-01',
    items: [
      { type: 'new', key: 'v280_new1' },
      { type: 'new', key: 'v280_new2' },
      { type: 'improved', key: 'v280_imp1' },
      { type: 'fixed', key: 'v280_fix1' },
    ],
  },
  {
    version: '2.7.0',
    date: '2025-02-10',
    items: [
      { type: 'new', key: 'v270_new1' },
      { type: 'improved', key: 'v270_imp1' },
      { type: 'improved', key: 'v270_imp2' },
      { type: 'fixed', key: 'v270_fix1' },
    ],
  },
  {
    version: '2.6.0',
    date: '2025-01-20',
    items: [
      { type: 'new', key: 'v260_new1' },
      { type: 'new', key: 'v260_new2' },
      { type: 'fixed', key: 'v260_fix1' },
      { type: 'fixed', key: 'v260_fix2' },
    ],
  },
  {
    version: '2.5.0',
    date: '2025-01-05',
    items: [
      { type: 'new', key: 'v250_new1' },
      { type: 'improved', key: 'v250_imp1' },
      { type: 'fixed', key: 'v250_fix1' },
    ],
  },
  {
    version: '2.4.0',
    date: '2024-12-15',
    items: [
      { type: 'new', key: 'v240_new1' },
      { type: 'new', key: 'v240_new2' },
      { type: 'improved', key: 'v240_imp1' },
    ],
  },
  {
    version: '2.3.0',
    date: '2024-11-28',
    items: [
      { type: 'new', key: 'v230_new1' },
      { type: 'improved', key: 'v230_imp1' },
      { type: 'fixed', key: 'v230_fix1' },
    ],
  },
  {
    version: '2.2.0',
    date: '2024-11-10',
    items: [
      { type: 'new', key: 'v220_new1' },
      { type: 'improved', key: 'v220_imp1' },
      { type: 'fixed', key: 'v220_fix1' },
      { type: 'fixed', key: 'v220_fix2' },
    ],
  },
  {
    version: '2.1.0',
    date: '2024-10-20',
    items: [
      { type: 'new', key: 'v210_new1' },
      { type: 'new', key: 'v210_new2' },
      { type: 'improved', key: 'v210_imp1' },
    ],
  },
];
