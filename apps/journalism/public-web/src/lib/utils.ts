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
  if (!ts) return 'Unpublished';
  return new Date(ts).toISOString();
}

export function formatTimeAgo(ts: number | null): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return formatDate(ts);
}

export function readingTime(body: string): string {
  const words = body.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

// ── Category Colors ─────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
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
    description: 'Crimes against women, policing, judiciary, and legal accountability.',
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
