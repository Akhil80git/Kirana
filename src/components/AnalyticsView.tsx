import React, { useState, useMemo, useEffect } from 'react';
import { TodoItem, DateFilter, FilterStatus, SortOption } from '../types/todo';
import { TodoCard } from './TodoCard';
import { SkeletonCard } from './SkeletonCard';
import { matchesDateFilter } from '../lib/dateUtils';
import { 
  Calendar, 
  Search, 
  SlidersHorizontal, 
  X,
  Clock,
  RotateCcw,
  BarChart3
} from 'lucide-react';

interface AnalyticsViewProps {
  todos: TodoItem[];
  onUpdateTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (todo: TodoItem) => void;
  onShareTodo: (todo: TodoItem) => void;
}

// Global In-Memory Cache for Analytics Calculations
let cachedAnalyticsVersion = -1;
let hasAnalyticsCached = false;

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  todos,
  onUpdateTodo,
  onDeleteTodo,
  onEditTodo,
  onShareTodo,
}) => {
  // Check if we need loader on first visit
  const [isLoaded, setIsLoaded] = useState(() => hasAnalyticsCached);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedExactDate, setSelectedExactDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Load once with loader, then keep in memory cache for 0ms instant tab switching
  useEffect(() => {
    const currentVersion = todos.length + (todos[0]?.updatedAt || 0);

    if (hasAnalyticsCached && cachedAnalyticsVersion === currentVersion) {
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    const timer = setTimeout(() => {
      hasAnalyticsCached = true;
      cachedAnalyticsVersion = currentVersion;
      setIsLoaded(true);
    }, 130);

    return () => clearTimeout(timer);
  }, [todos]);

  // Extract distinct available months from user's actual tasks
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    todos.forEach(t => {
      const d = new Date(t.createdAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(ym);
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Array.from(monthsSet).sort().reverse().map(ym => {
      const [y, m] = ym.split('-');
      const mName = monthNames[parseInt(m, 10) - 1];
      return { id: ym, label: `${mName} ${y}` };
    });
  }, [todos]);

  // Filter Todos based on deep user choices
  const filteredTodos = useMemo(() => {
    return todos
      .filter(todo => {
        // Date / Month Filter
        if (!matchesDateFilter(todo.createdAt, dateFilter, selectedExactDate, selectedMonth)) {
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
  }, [todos, dateFilter, selectedMonth, selectedExactDate, statusFilter, searchQuery, sortOption]);

  // Compute Analytics strictly from the filtered items
  const analyticsData = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;
    let totalSamanAmount = 0;
    let boughtAmount = 0;
    let pendingAmount = 0;
    let pricedProductCount = 0;

    filteredTodos.forEach(todo => {
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
      totalLists: filteredTodos.length,
      totalItems,
      completedItems,
      completionRate,
      totalSamanAmount,
      boughtAmount,
      pendingAmount,
      pricedProductCount,
      avgPrice,
    };
  }, [filteredTodos]);

  const handleResetFilters = () => {
    setDateFilter('all');
    setSelectedMonth('all');
    setSelectedExactDate('');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = dateFilter !== 'all' || selectedMonth !== 'all' || selectedExactDate !== '' || statusFilter !== 'all' || searchQuery !== '';

  if (!isLoaded) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">हिसाब तैयार हो रहा है...</h3>
              <p className="text-xs text-zinc-400">एक बार लोड होने पर यह मेमोरी में सुरक्षित रहेगा।</p>
            </div>
          </div>
          <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2">
      
      {/* 1. Date & Month Filters Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span>तारीख और महीने अनुसार फिल्टर (Date & Month Filter)</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>रीसेट करें</span>
            </button>
          )}
        </div>

        {/* Date Quick Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all' as DateFilter, label: 'सभी' },
            { id: 'today' as DateFilter, label: 'आज' },
            { id: 'yesterday' as DateFilter, label: 'कल' },
            { id: 'this_week' as DateFilter, label: 'इस हफ्ते' },
            { id: 'this_month' as DateFilter, label: 'इस महीने' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                setDateFilter(opt.id);
                setSelectedExactDate('');
                setSelectedMonth('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                dateFilter === opt.id && !selectedExactDate && selectedMonth === 'all'
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Month Selector & Exact Date Picker Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
          
          {/* Month Wise Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-400 shrink-0">महीना:</span>
            <select
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(e.target.value);
                setSelectedExactDate('');
                setDateFilter('all');
              }}
              className="bg-transparent text-white w-full focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900 text-white">सभी महीने (All Months)</option>
              {availableMonths.map(m => (
                <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Exact Date Picker */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-400 shrink-0">तारीख:</span>
            <input
              type="date"
              value={selectedExactDate}
              onChange={e => {
                setSelectedExactDate(e.target.value);
                setSelectedMonth('all');
                setDateFilter('all');
              }}
              className="bg-transparent text-white w-full focus:outline-none cursor-pointer text-xs"
            />
            {selectedExactDate && (
              <button
                onClick={() => setSelectedExactDate('')}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Type Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {[
              { id: 'all' as FilterStatus, label: 'सभी' },
              { id: 'saman' as FilterStatus, label: 'सामान' },
              { id: 'checklist' as FilterStatus, label: 'टास्क' },
              { id: 'completed' as FilterStatus, label: 'पूरे' },
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
              placeholder="खोजें..."
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

      {/* 2. Real Filtered Metrics Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-zinc-300 tracking-tight">
            चुने गए फिल्टर का हिसाब (Filtered Summary)
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            {filteredTodos.length} लिस्ट्स
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">कुल सामान खर्च</span>
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              ₹{analyticsData.totalSamanAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">खरीदा गया</span>
            <span className="text-base sm:text-lg font-bold text-zinc-200 font-mono">
              ₹{analyticsData.boughtAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">बाकी सामान</span>
            <span className="text-base sm:text-lg font-bold text-zinc-400 font-mono">
              ₹{analyticsData.pendingAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">काम पूरे</span>
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              {analyticsData.completionRate}%
            </span>
          </div>

        </div>
      </div>

      {/* 3. Filtered Results Grid */}
      <div>
        {filteredTodos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
          <div className="py-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white">इस फिल्टर में कोई लिस्ट नहीं मिली</h4>
            <p className="text-xs text-zinc-400 mt-1">
              महीना या तारीख बदलकर देखें।
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
