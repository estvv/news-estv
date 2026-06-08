export const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200'
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200'
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200'
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200'
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200'
  },
  neutral: {
    bg: 'bg-neutral-50',
    text: 'text-neutral-700',
    border: 'border-neutral-200'
  }
};

import type { ArxivCategory } from '../types';

export function getTagColor(categoryId: string, categories: ArxivCategory[]): { bg: string; text: string; border: string } {
  const category = categories.find(c => c.id === categoryId);
  if (category && TAG_COLORS[category.color]) {
    return TAG_COLORS[category.color];
  }
  return TAG_COLORS.neutral;
}