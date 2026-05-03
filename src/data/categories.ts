import type { Category } from '../types/domain';

export const categories: Category[] = [
  { id: 'cat-led', name: 'Светодиодные', slug: 'led', sortOrder: 1, isActive: true },
  { id: 'cat-eco', name: 'Энергосберегающие', slug: 'eco', sortOrder: 2, isActive: true },
  { id: 'cat-halogen', name: 'Галогенные', slug: 'halogen', sortOrder: 3, isActive: true },
  { id: 'cat-incandescent', name: 'Лампы накаливания', slug: 'incandescent', sortOrder: 4, isActive: true },
  { id: 'cat-smart', name: 'Умные лампы', slug: 'smart', sortOrder: 5, isActive: true },
];
