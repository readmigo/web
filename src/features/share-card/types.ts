export interface ShareCardContent {
  text: string;
  author?: string;
  bookTitle?: string;
  source: 'highlight' | 'quote' | 'agora' | 'custom';
}

export type ShareCardTheme = 'light' | 'dark' | 'warm' | 'vintage' | 'nature' | 'elegant' | 'ocean' | 'sunset';

export interface ShareCardThemeConfig {
  backgroundColor: string;
  textColor: string;
  secondaryColor: string;
  accentColor: string;
  isPremium: boolean;
}

export const SHARE_CARD_THEMES: Record<ShareCardTheme, ShareCardThemeConfig> = {
  light:   { backgroundColor: '#FFFFFF', textColor: '#333333', secondaryColor: '#737373', accentColor: '#B3B3B3', isPremium: false },
  dark:    { backgroundColor: '#1F1F24', textColor: '#FFFFFF', secondaryColor: '#999999', accentColor: '#666666', isPremium: false },
  warm:    { backgroundColor: '#FAF5E8', textColor: '#594533', secondaryColor: '#8C7861', accentColor: '#BFA88C', isPremium: false },
  vintage: { backgroundColor: '#F5E6D3', textColor: '#5D4037', secondaryColor: '#795548', accentColor: '#A1887F', isPremium: false },
  nature:  { backgroundColor: '#E8F5E9', textColor: '#2E7D32', secondaryColor: '#558B2F', accentColor: '#81C784', isPremium: false },
  elegant: { backgroundColor: '#FFF8E1', textColor: '#6D4C41', secondaryColor: '#8D6E63', accentColor: '#BCAAA4', isPremium: true },
  ocean:   { backgroundColor: '#E3F2FD', textColor: '#1565C0', secondaryColor: '#1976D2', accentColor: '#64B5F6', isPremium: true },
  sunset:  { backgroundColor: '#FFF3E0', textColor: '#E65100', secondaryColor: '#F57C00', accentColor: '#FFB74D', isPremium: true },
};
