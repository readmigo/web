// Author types for web app

export interface Author {
  id: string;
  name: string;
  nameZh?: string;
  aliases: string[];
  avatarUrl?: string;
  bio?: string;
  bioZh?: string;
  era?: string;
  nationality?: string;
  birthPlace?: string;
  writingStyle?: string;
  famousWorks: string[];
  literaryPeriod?: string;
  wikipediaUrl?: string;
  wikidataId?: string;
  bookCount: number;
  quoteCount: number;
  followerCount: number;
  isActive: boolean;
}

export interface AuthorDetail extends Author {
  books: AuthorBook[];
  quotes: AuthorQuote[];
  timeline: AuthorTimelineEvent[];
  civilizationMap?: CivilizationMap;
  isFollowing?: boolean;
}

// Civilization Map types - Phase 5
export interface CivilizationMap {
  // Core positioning
  literaryMovement?: string;
  historicalPeriod?: string;

  // Influence network
  influences: {
    predecessors: AuthorLink[];
    successors: AuthorLink[];
    contemporaries: AuthorLink[];
    mentors?: AuthorLink[];
    students?: AuthorLink[];
  };

  // Genre and themes
  primaryGenres?: string[];
  themes?: string[];

  // Cross-domain positioning
  domains?: DomainPosition[];

  // Historical events during lifetime
  historicalContext?: HistoricalEvent[];
}

export interface AuthorLink {
  id: string;
  name: string;
  nameZh?: string;
  avatarUrl?: string;
  era?: string;
  nationality?: string;
  relationship?: string; // "stylistic influence", "direct mentor", etc.
}

export interface DomainPosition {
  domain: string; // "literature", "philosophy", "politics"
  significance: 'major' | 'moderate' | 'minor';
  contributions: string[];
}

export interface HistoricalEvent {
  year: number;
  title: string;
  titleZh?: string;
  category: 'war' | 'revolution' | 'cultural' | 'political' | 'scientific';
}

export interface AuthorBook {
  id: string;
  title: string;
  titleZh?: string;
  coverUrl?: string;
  difficulty?: number;
  publishYear?: number;
}

export interface AuthorQuote {
  id: string;
  text: string;
  textZh?: string;
  source?: string;
  sourceZh?: string;
  likeCount: number;
  isLiked?: boolean;
}

export interface AuthorTimelineEvent {
  id: string;
  year: number;
  title: string;
  titleZh?: string;
  description?: string;
  category: TimelineCategory;
}

export type TimelineCategory =
  | 'BIRTH'
  | 'EDUCATION'
  | 'WORK'
  | 'MAJOR_EVENT'
  | 'AWARD'
  | 'DEATH';

export interface AuthorListItem {
  id: string;
  name: string;
  nameZh?: string;
  avatarUrl?: string;
  era?: string;
  nationality?: string;
  bookCount: number;
  famousWorks: string[];
}

export interface AuthorListResponse {
  authors: AuthorListItem[];
  total: number;
  page: number;
  pageSize: number;
}
