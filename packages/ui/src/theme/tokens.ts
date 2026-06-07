export const COMMUNITY_THEME = {
  name: 'community',
  colors: {
    bg: '#FFFFFF',
    bgElevated: '#F8F9FA',
    bgHover: '#F1F3F4',
    border: '#DADCE0',
    borderBright: '#BDC1C6',
    fg: '#202124',
    fgMuted: '#5F6368',
    fgDim: '#80868B',
    primary: '#1A73E8',
    primaryDim: 'rgba(26, 115, 232, 0.12)',
    danger: '#D93025',
    success: '#188038',
    warning: '#F9AB00',
  },
  fonts: {
    mono: 'SpaceMono',
    ui: 'Inter',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, lg: 12 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.1)',
    md: '0 4px 12px rgba(0,0,0,0.1)',
    lg: '0 8px 24px rgba(0,0,0,0.15)',
  },
} as const;

export const JOURNALISM_THEME = {
  name: 'journalism',
  colors: {
    bg: '#0A0E17',
    bgElevated: '#111827',
    bgHover: '#1F2937',
    border: '#1F2937',
    borderBright: '#374151',
    fg: '#E5E7EB',
    fgMuted: '#9CA3AF',
    fgDim: '#6B7280',
    accent: '#00D4AA',
    accentDim: 'rgba(0, 212, 170, 0.12)',
    accentHover: '#00EBB3',
    entity: {
      person: '#3B82F6',
      organization: '#8B5CF6',
      location: '#10B981',
      event: '#F59E0B',
      document: '#EC4899',
    },
    status: {
      danger: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
      info: '#3B82F6',
    },
  },
  fonts: {
    mono: 'SpaceMono',
    ui: 'Inter',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, lg: 12 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 12px rgba(0,0,0,0.4)',
    lg: '0 8px 24px rgba(0,0,0,0.5)',
  },
  density: {
    compact: { rowHeight: 32, fontSize: 12, padding: 8 },
    comfortable: { rowHeight: 44, fontSize: 14, padding: 12 },
    spacious: { rowHeight: 56, fontSize: 16, padding: 16 },
  },
} as const;

export type ThemeName = 'community' | 'journalism';
export const THEMES = {
  community: COMMUNITY_THEME,
  journalism: JOURNALISM_THEME,
} as const;
export type Theme = (typeof THEMES)[ThemeName];

export function getTheme(name: ThemeName): Theme {
  return THEMES[name];
}