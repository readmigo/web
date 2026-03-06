export type TemplateCategory =
  | 'MINIMAL' | 'NATURE' | 'LITERARY' | 'VINTAGE' | 'MODERN'
  | 'ARTISTIC' | 'SEASONAL' | 'CLASSIC' | 'ELEGANT' | 'OCEAN'
  | 'SUNSET' | 'GRADIENT' | 'POLAROID';

export interface PostcardQuote {
  id: string;
  text: string;
  author?: string;
  source?: string;
}

export interface Postcard {
  id: string;
  userId: string;
  templateId: string;
  quote?: PostcardQuote;
  customText?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  isPublic: boolean;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostcardTemplate {
  id: string;
  name: string;
  previewUrl?: string;
  backgroundColor: string;
  fontFamily: string;
  fontColor: string;
  isPremium: boolean;
  isAvailable?: boolean;
  category?: TemplateCategory;
  sortOrder?: number;
  secondaryColor?: string;
  decorationIcon?: string;
  gradientColors?: string[];
}

export interface PostcardsResponse {
  postcards: Postcard[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePostcardRequest {
  templateId: string;
  quoteId?: string;
  customText?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  isPublic: boolean;
}

export interface PostcardDraft {
  templateId?: string;
  template?: PostcardTemplate;
  quoteId?: string;
  customText?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  isPublic: boolean;
}

export const FONT_OPTIONS = [
  { value: 'system-ui', label: 'System' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Menlo', label: 'Menlo' },
  { value: 'ui-rounded', label: 'Rounded' },
] as const;

export const COLOR_PRESETS = [
  '#FFFFFF', '#F5E6D3', '#1A1A2E', '#E8F5E9',
  '#FFF8E1', '#FAFAFA', '#E3F2FD', '#FFF3E0',
  '#FCE4EC', '#F3E5F5', '#E0F7FA', '#333333',
] as const;
