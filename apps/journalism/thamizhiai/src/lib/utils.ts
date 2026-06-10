import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date Formatting ──────────────────────────────────────────────
export function formatDate(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatISODate(ts: number | null): string {
  if (!ts) return '';
  return new Date(ts).toISOString();
}

// ── Time strings with i18n support ────────────────────────────
const TIME_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: { justNow: 'just now', minAgo: '{{n}}m ago', hrAgo: '{{n}}h ago', dayAgo: '{{n}}d ago', wkAgo: '{{n}}w ago', minRead: '{{n}} min read' },
  ta: { justNow: 'இப்போதுதான்', minAgo: '{{n}} நிமி முன்', hrAgo: '{{n}} மணி முன்', dayAgo: '{{n}} நா முன்', wkAgo: '{{n}} வா முன்', minRead: '{{n}} நிமிட வாசிப்பு' },
};

function timeStr(key: string, n: number, lang: string): string {
  const dict = TIME_TRANSLATIONS[lang] || TIME_TRANSLATIONS.en;
  return (dict[key] || TIME_TRANSLATIONS.en[key] || key).replace('{{n}}', String(n));
}

export function formatTimeAgo(ts: number | null, lang = 'en'): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return timeStr('justNow', 0, lang);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return timeStr('minAgo', minutes, lang);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return timeStr('hrAgo', hours, lang);
  const days = Math.floor(hours / 24);
  if (days < 7) return timeStr('dayAgo', days, lang);
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return timeStr('wkAgo', weeks, lang);
  return formatDate(ts);
}

export function readingTime(body: string, lang = 'en'): string {
  const words = body.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return timeStr('minRead', minutes, lang);
}

export function getWordCount(body: string): number {
  return body.split(/\s+/).length;
}

// ── Category Colors ─────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  'women-violence': 'rose',
  investigation: 'red',
  economy: 'teal',
  environment: 'green',
  technology: 'blue',
  culture: 'purple',
  crime: 'rose',
  education: 'amber',
  health: 'emerald',
  'human-rights': 'orange',
  agriculture: 'lime',
  infrastructure: 'cyan',
  sports: 'violet',
  'social-welfare': 'pink',
};

export const TYPE_COLORS: Record<string, string> = {
  person: 'blue',
  organization: 'purple',
  location: 'green',
  event: 'amber',
  document: 'red',
};

import type { BadgeProps } from '../components/ui/badge';

export function badgeVariant(category: string): BadgeProps['variant'] {
  return (CATEGORY_COLORS[category] || 'muted') as BadgeProps['variant'];
}

export const ENTITY_COLORS: Record<string, string> = {
  person: '#2563EB',
  organization: '#7C3AED',
  location: '#059669',
  event: '#D97706',
  document: '#DC2626',
};

// ── Domain Descriptions ─────────────────────────────────────────
export const DOMAIN_INFO: Record<string, { label: string; description: string }> = {
  'women-violence': {
    label: 'Women Violence',
    description: 'Gender-based violence, domestic abuse, sexual assault, femicide, and justice for survivors.',
  },
  economy: {
    label: 'Economy',
    description: 'Markets, trade, industry, and economic development.',
  },
  environment: {
    label: 'Environment',
    description: 'Climate, ecology, conservation, and environmental justice.',
  },
  technology: {
    label: 'Technology',
    description: 'Innovation, digital infrastructure, and the tech industry.',
  },
  culture: {
    label: 'Culture',
    description: 'Arts, heritage, language, literature, and cultural discourse.',
  },
  investigation: {
    label: 'Investigation',
    description: 'In-depth investigative reporting and accountability journalism.',
  },
  crime: {
    label: 'Crime & Justice',
    description: 'Policing, judiciary, corruption, and legal accountability.',
  },
  education: {
    label: 'Education',
    description: 'Schools, universities, policy, and the future of learning.',
  },
  health: {
    label: 'Health',
    description: 'Healthcare access, public health, medicine, and well-being.',
  },
  'human-rights': {
    label: 'Human Rights',
    description: 'Civil liberties, social justice, equality, and marginalised voices.',
  },
  agriculture: {
    label: 'Agriculture',
    description: 'Farming, rural livelihoods, agrarian distress, and food security.',
  },
  infrastructure: {
    label: 'Infrastructure',
    description: 'Transport, urban development, water, energy, and public works.',
  },
  sports: {
    label: 'Sports',
    description: 'Athletics, games, sporting culture, and achievement.',
  },
  'social-welfare': {
    label: 'Social Welfare',
    description: 'Government schemes, welfare benefits, and support for vulnerable communities.',
  },
};
