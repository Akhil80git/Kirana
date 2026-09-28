export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TodoType = 'saman' | 'checklist' | 'ecommerce' | 'packing';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  price?: number; // Price per item (in ₹)
  quantity?: number; // Quantity / Aunty (defaults to 1)
  createdAt: number;
}

export interface TodoItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  color: string; // Hex or theme color key
  type: TodoType;
  priority: Priority;
  completed: boolean;
  category?: string;
  subtasks: SubTask[];
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

export interface AppUser {
  id: string;
  username: string;
  createdAt: number;
  displayName?: string;
}

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  border: string;
  badge: string;
  bgLight: string;
  gradient: string;
  textLight: string;
}

export const COLOR_THEMES: Record<string, ColorTheme> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Mint',
    primary: '#10b981',
    secondary: '#059669',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    bgLight: 'from-emerald-950/40 to-slate-900/40',
    gradient: 'from-emerald-500 to-teal-600',
    textLight: 'text-emerald-400',
  },
  amber: {
    id: 'amber',
    name: 'Solar Gold',
    primary: '#f59e0b',
    secondary: '#d97706',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    bgLight: 'from-amber-950/40 to-slate-900/40',
    gradient: 'from-amber-500 to-orange-600',
    textLight: 'text-amber-400',
  },
  purple: {
    id: 'purple',
    name: 'Cyber Violet',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    border: 'border-purple-500/30 hover:border-purple-500/60',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    bgLight: 'from-purple-950/40 to-slate-900/40',
    gradient: 'from-purple-500 to-indigo-600',
    textLight: 'text-purple-400',
  },
  rose: {
    id: 'rose',
    name: 'Sunset Rose',
    primary: '#f43f5e',
    secondary: '#e11d48',
    border: 'border-rose-500/30 hover:border-rose-500/60',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    bgLight: 'from-rose-950/40 to-slate-900/40',
    gradient: 'from-rose-500 to-pink-600',
    textLight: 'text-rose-400',
  },
  sky: {
    id: 'sky',
    name: 'Ocean Sky',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    border: 'border-sky-500/30 hover:border-sky-500/60',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    bgLight: 'from-sky-950/40 to-slate-900/40',
    gradient: 'from-sky-500 to-blue-600',
    textLight: 'text-sky-400',
  },
  indigo: {
    id: 'indigo',
    name: 'Electric Indigo',
    primary: '#6366f1',
    secondary: '#4f46e5',
    border: 'border-indigo-500/30 hover:border-indigo-500/60',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    bgLight: 'from-indigo-950/40 to-slate-900/40',
    gradient: 'from-indigo-500 to-violet-600',
    textLight: 'text-indigo-400',
  },
};

export type ActiveTab = 'view' | 'templates' | 'analytics';
export type DateFilter = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month';
export type FilterStatus = 'all' | 'saman' | 'checklist' | 'completed';
export type SortOption = 'newest' | 'oldest' | 'price_desc' | 'alphabetical';
