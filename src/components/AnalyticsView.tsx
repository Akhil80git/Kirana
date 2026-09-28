import React, { useState, useMemo } from 'react';
import { TodoItem, DateFilter, FilterStatus, SortOption } from '../types/todo';
import { TodoCard } from './TodoCard';
import { matchesDateFilter } from '../lib/dateUtils';
import { 
  BarChart3, 
  Calendar, 
  Search, 
  SlidersHorizontal, 
  X 
} from 'lucide-react';

interface AnalyticsViewProps {
  todos: TodoItem[];
  onUpdateTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (todo: TodoItem) => void;
  onShareTodo: (todo: TodoItem) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  todos,
  onUpdateTodo,
  onDeleteTodo,
  onEditTodo,
  onShareTodo,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Compute Overall Analytics
  const analyticsData = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;
    let totalSamanAmount = 0;
    let boughtAmount = 0;
    let pendingAmount = 0;
    let pricedProductCount = 0;

    todos.forEach(todo => {
      const isSaman = todo.type === 'saman' || todo.type === 'ecommerce';
      if (todo.subtasks && todo.subtasks.length > 0) {
        todo.subtasks.forEach(sub => {
          totalItems += 1;
          if (sub.completed) completedItems += 1;

          if (isSaman && sub.price !== undefined && sub.price > 0) {
            const cost = sub.price * (sub.quantity || 1);
            pricedProductCount += 1;
            totalSamanAmount += cost;
            if (sub.completed) {
              boughtAmount += cost;
            } else {
              pendingAmount += cost;
            }
          }
        });
      } else {
        totalItems += 1;
        if (todo.completed) completedItems += 1;
      }
    });

    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const avgPrice = pricedProductCount > 0 ? Math.round(totalSamanAmount / pricedProductCount) : 0;

    return {
      totalLists: todos.length,
      totalItems,
      completedItems,
      completionRate,
      totalSamanAmount,
      boughtAmount,
      pendingAmount,
      pricedProductCount,
      avgPrice,
    };
  }, [todos]);

  // Filter Todos based on deep filters & date
  const filteredTodos = useMemo(() => {
    return todos
      .filter(todo => {
        // Date Filter
        if (!matchesDateFilter(todo.createdAt, dateFilter)) {
          return false;
        }

        // Status / Type Filter
        if (statusFilter === 'saman' && !(todo.type === 'saman' || todo.type === 'ecommerce')) {
          return false;
        }
        if (statusFilter === 'checklist' && todo.type !== 'checklist' && todo.type !== 'packing') {
          return false;
        }
        if (statusFilter === 'completed' && !todo.completed) {
          return false;
        }

        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = todo.title.toLowerCase().includes(q);
          const matchSub = (todo.subtasks || []).some(s => s.title.toLowerCase().includes(q));
          if (!matchTitle && !matchSub) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.createdAt - a.createdAt;
        if (sortOption === 'oldest') return a.createdAt - b.createdAt;
        if (sortOption === 'alphabetical') return a.title.localeCompare(b.title);
        if (sortOption === 'price_desc') {
          const sumA = (a.subtasks || []).reduce((acc, s) => acc + (s.price || 0) * (s.quantity || 1), 0);
          const sumB = (b.subtasks || []).reduce((acc, s) => acc + (s.price || 0) * (s.quantity || 1), 0);
          return sumB - sumA;
        }
        return 0;
      });
  }, [todos, dateFilter, statusFilter, searchQuery, sortOption]);

  const dateOptions: { id: DateFilter; label: string }[] = [
    { id: 'all', label: 'सभी तारीखें' },
    { id: 'today', label: 'आज' },
    { id: 'yesterday', label: 'कल' },
    { id: 'this_week', label: 'इस हफ्ते' },
    { id: 'this_month', label: 'इस महीने' },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2">
      
      {/* Top Neutral Stats Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <h2 className="text-sm font-bold text-white tracking-tight mb-3">
          खर्च और टास्क हिसाब (Analytics)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 block">कुल सामान खर्च</span>
            <span className="text-lg font-bold text-white font-mono">
              ₹{analyticsData.totalSamanAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 block">खरीदा गया</span>
            <span className="text-lg font-bold text-zinc-200 font-mono">
              ₹{analyticsData.boughtAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 block">बाकी सामान</span>
            <span className="text-lg font-bold text-zinc-400 font-mono">
              ₹{analyticsData.pendingAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 block">काम पूरे</span>
            <span className="text-lg font-bold text-white font-mono">
              {analyticsData.completionRate}%
            </span>
          </div>

        </div>
      </div>

      {/* Date & Type Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-3">
        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" /> तारीख:
          </span>
          {dateOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setDateFilter(opt.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                dateFilter === opt.id
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Status / Category & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {[
              { id: 'all' as FilterStatus, label: 'सभी' },
              { id: 'saman' as FilterStatus, label: 'सामान' },
              { id: 'checklist' as FilterStatus, label: 'टास्क' },
              { id: 'completed' as FilterStatus, label: 'पूरे हुए' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  statusFilter === tab.id
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="नाम से खोजें..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtered Cards Results */}
      <div>
        {filteredTodos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTodos.map(todo => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onUpdate={onUpdateTodo}
                onDelete={onDeleteTodo}
                onEdit={onEditTodo}
                onShare={onShareTodo}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white">कोई लिस्ट नहीं मिली</h4>
            <p className="text-xs text-zinc-400 mt-1">
              फिल्टर बदलकर देखें या 'सभी तारीखें' पर क्लिक करें।
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
