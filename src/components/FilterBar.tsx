import React from 'react';
import { FilterStatus, SortOption, COLOR_THEMES } from '../types/todo';
import { Search, ArrowUpDown, X, ShoppingBag, CheckSquare } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (s: FilterStatus) => void;
  selectedColor: string | null;
  onSelectedColorChange: (c: string | null) => void;
  sortOption: SortOption;
  onSortOptionChange: (o: SortOption) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  selectedColor,
  onSelectedColorChange,
  sortOption,
  onSortOptionChange,
}) => {
  const statusFilters: { id: FilterStatus; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'सभी लिस्ट (All)' },
    { id: 'saman', label: 'सामान & कीमत (Saman)' },
    { id: 'checklist', label: 'टास्क चेकलिस्ट (Tasks)' },
    { id: 'completed', label: 'पूरे हुए (Done)' },
  ];

  const colorEntries = Object.entries(COLOR_THEMES);

  return (
    <div className="space-y-3 mb-5">
      {/* Search & Sort Row */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="सामान, टास्क या लिस्ट का नाम खोजें (Search)..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">क्रम:</span>
          <select
            value={sortOption}
            onChange={e => onSortOptionChange(e.target.value as SortOption)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="newest" className="bg-slate-900 text-white">नया पहले (Newest)</option>
            <option value="oldest" className="bg-slate-900 text-white">पुराना पहले (Oldest)</option>
            <option value="price_desc" className="bg-slate-900 text-white">ज्यादा कीमत (High Price)</option>
            <option value="alphabetical" className="bg-slate-900 text-white">नाम अनुसार (A-Z)</option>
          </select>
        </div>

      </div>

      {/* Tabs & Color Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        
        {/* Status Segmented Control */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
          {statusFilters.map(tab => (
            <button
              key={tab.id}
              onClick={() => onFilterStatusChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Color Palette Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => onSelectedColorChange(null)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              selectedColor === null
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            सभी रंग
          </button>

          {colorEntries.map(([key, theme]) => (
            <button
              key={key}
              onClick={() => onSelectedColorChange(selectedColor === key ? null : key)}
              title={theme.name}
              className={`w-5 h-5 rounded-full transition-transform relative flex items-center justify-center ${
                selectedColor === key ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: theme.primary }}
            >
              {selectedColor === key && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
