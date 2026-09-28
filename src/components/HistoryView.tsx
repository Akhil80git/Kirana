import React, { useState, useTransition } from 'react';
import { TodoItem, HistoryPeriod } from '../types/todo';
import { formatCardDateTime } from '../lib/dateUtils';
import { SkeletonCard } from './SkeletonCard';
import { 
  History, 
  Search, 
  RotateCcw, 
  Trash2, 
  CheckCheck, 
  Calendar,
  X,
  ShoppingBag,
  CheckSquare,
  ShoppingCart
} from 'lucide-react';

interface HistoryViewProps {
  getCompletedTodos: () => TodoItem[];
  onRestoreTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
}

// PERSISTENT CACHE FOR HISTORY (Once loaded, tab switches are 0ms instant!)
const historyPeriodCache = new Map<HistoryPeriod, TodoItem[]>();

export const HistoryView: React.FC<HistoryViewProps> = ({
  getCompletedTodos,
  onRestoreTodo,
  onDeleteTodo,
}) => {
  // Check if a period was previously selected and cached
  const [selectedPeriod, setSelectedPeriod] = useState<HistoryPeriod | null>(() => {
    // If any period was already cached, we can retain it
    return null;
  });
  const [loadedItems, setLoadedItems] = useState<TodoItem[]>([]);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, startTransition] = useTransition();

  // Load history data strictly when user clicks a period (with Cache!)
  const handleSelectPeriod = (period: HistoryPeriod, forceRecalculate = false) => {
    setSelectedPeriod(period);

    // 1. Instant Cache Hit (0ms - No API, No Delay!)
    if (historyPeriodCache.has(period) && !forceRecalculate) {
      setLoadedItems(historyPeriodCache.get(period)!);
      setIsLoadingPeriod(false);
      return;
    }

    // 2. Cache Miss: Run loader briefly, compute, and store in cache
    setIsLoadingPeriod(true);

    setTimeout(() => {
      startTransition(() => {
        const allCompleted = getCompletedTodos();
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

        const filtered = allCompleted.filter(todo => {
          const itemTime = todo.updatedAt || todo.createdAt;
          if (period === '30_days') {
            return itemTime >= thirtyDaysAgo;
          }
          if (period === '6_months') {
            return itemTime >= sixMonthsAgo;
          }
          return true; // 'all'
        }).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

        // Save in cache
        historyPeriodCache.set(period, filtered);
        setLoadedItems(filtered);
        setIsLoadingPeriod(false);
      });
    }, 140);
  };

  // Search within loaded period
  const displayItems = loadedItems.filter(todo => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = todo.title.toLowerCase().includes(q);
    const matchSub = (todo.subtasks || []).some(s => s.title.toLowerCase().includes(q));
    return matchTitle || matchSub;
  });

  // Analytics for the selected period
  const periodStats = React.useMemo(() => {
    let totalPurchased = 0;
    let totalSubtasksDone = 0;

    displayItems.forEach(todo => {
      const isSaman = todo.type === 'saman' || todo.type === 'ecommerce';
      if (todo.subtasks) {
        todo.subtasks.forEach(s => {
          if (s.completed) {
            totalSubtasksDone++;
            if (isSaman && s.price) {
              totalPurchased += s.price * (s.quantity || 1);
            }
          }
        });
      }
    });

    return {
      totalLists: displayItems.length,
      totalPurchased,
      totalSubtasksDone,
    };
  }, [displayItems]);

  const handleResetPeriod = () => {
    setSelectedPeriod(null);
    setLoadedItems([]);
    setSearchQuery('');
  };

  const handleRestore = (todo: TodoItem) => {
    // Invalidate period cache so restored item disappears
    historyPeriodCache.clear();
    onRestoreTodo(todo);
    setLoadedItems(prev => prev.filter(t => t.id !== todo.id));
  };

  const handleDelete = (id: string) => {
    historyPeriodCache.clear();
    onDeleteTodo(id);
    setLoadedItems(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2">
      
      {/* 1. Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                पूर्ण कार्य इतिहास (Completed History)
              </h2>
              <p className="text-xs text-zinc-400">
                कैश्ड ऑन-डिमांड: एक बार लोड होने पर दोबारा कभी देरी नहीं होगी।
              </p>
            </div>
          </div>

          {selectedPeriod && (
            <button
              onClick={handleResetPeriod}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>अवधि बदलें</span>
            </button>
          )}
        </div>

        {/* Period Selector Buttons */}
        <div className="pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-zinc-400 mr-1 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" /> अवधि चुनें:
            </span>

            {[
              { id: '30_days' as HistoryPeriod, label: 'पिछले 30 दिन' },
              { id: '6_months' as HistoryPeriod, label: 'पिछले 6 महीने' },
              { id: 'all' as HistoryPeriod, label: 'शुरू से अब तक (All)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleSelectPeriod(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedPeriod === tab.id
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 active:scale-95'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar & Stats if a period is selected */}
        {selectedPeriod && !isLoadingPeriod && (
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <span className="font-mono text-zinc-400">
                {displayItems.length} पूरी लिस्ट
              </span>
              <span>•</span>
              <span className="font-mono text-white font-bold">
                कुल खर्च: ₹{periodStats.totalPurchased.toLocaleString()}
              </span>
            </div>

            <div className="relative sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="इतिहास में खोजें..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Content Area */}
      
      {/* CASE A: No period chosen yet -> 100% CLEAN Landing State */}
      {selectedPeriod === null && (
        <div className="py-10 px-4 text-center max-w-lg mx-auto bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
            <History className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              इतिहास देखने के लिए अवधि चुनें
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              साइट को सुपरफास्ट रखने के लिए पुराना इतिहास तभी लोड होता है जब आप अवधि चुनते हैं।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => handleSelectPeriod('30_days')}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group"
            >
              <span className="text-xs font-bold text-white block group-hover:text-zinc-200">
                पिछले 30 दिन
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                हाल ही के पूरे कार्य
              </span>
            </button>

            <button
              onClick={() => handleSelectPeriod('6_months')}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group"
            >
              <span className="text-xs font-bold text-white block group-hover:text-zinc-200">
                पिछले 6 महीने
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                मध्यम अवधि हिसाब
              </span>
            </button>

            <button
              onClick={() => handleSelectPeriod('all')}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group"
            >
              <span className="text-xs font-bold text-white block group-hover:text-zinc-200">
                शुरू से अब तक
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                सभी पूर्ण डिटेल्स
              </span>
            </button>
          </div>
        </div>
      )}

      {/* CASE B: Loading with Frontend Skeleton Loaders */}
      {selectedPeriod !== null && isLoadingPeriod && (
        <div className="space-y-3">
          <div className="text-xs text-zinc-400 flex items-center gap-2 px-1">
            <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            <span>इतिहास लोड हो रहा है...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {/* CASE C: Period loaded -> Show Cards */}
      {selectedPeriod !== null && !isLoadingPeriod && (
        <div>
          {displayItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayItems.map(todo => {
                const isSaman = todo.type === 'saman' || todo.type === 'ecommerce';
                const { formatted: dateStr } = formatCardDateTime(todo.updatedAt || todo.createdAt);
                const totalCost = (todo.subtasks || []).reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 1), 0);

                return (
                  <div 
                    key={todo.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      {/* Top Row: Type, Date, Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          {todo.type === 'ecommerce' ? (
                            <ShoppingCart className="w-3.5 h-3.5 text-zinc-400" />
                          ) : isSaman ? (
                            <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          <span className="font-medium">
                            {todo.type === 'ecommerce' ? 'ई-कॉमर्स' : isSaman ? 'सामान' : 'टास्क'}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-[10px] text-zinc-500">{dateStr}</span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCheck className="w-3 h-3" />
                          <span>पूर्ण</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-zinc-200 line-through">
                        {todo.title}
                      </h3>

                      {/* Sample completed subtasks */}
                      {todo.subtasks && todo.subtasks.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1">
                          {todo.subtasks.slice(0, 3).map((sub, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-zinc-400">
                              <span className="truncate pr-2">• {sub.title}</span>
                              {isSaman && sub.price ? (
                                <span className="font-mono text-[11px] text-zinc-500 shrink-0">
                                  ₹{(sub.price * (sub.quantity || 1)).toLocaleString()}
                                </span>
                              ) : null}
                            </div>
                          ))}
                          {todo.subtasks.length > 3 && (
                            <div className="text-[10px] text-zinc-500">
                              +{todo.subtasks.length - 3} और आइटम्स...
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Row: Total & Restore */}
                    <div className="mt-3.5 pt-2.5 border-t border-zinc-800 flex items-center justify-between">
                      {isSaman && totalCost > 0 ? (
                        <div className="text-xs font-mono text-zinc-300">
                          खरीद: <span className="font-bold text-white">₹{totalCost.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-zinc-500">
                          {todo.subtasks?.length || 0} कार्य पूरे
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRestore(todo)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-semibold rounded-lg text-xs flex items-center gap-1 transition-transform"
                          title="वापस सक्रिय लिस्ट में लाएं"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>पुनः चालू करें</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(todo.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="हमेशा के लिए हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-14 text-center max-w-md mx-auto px-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              <History className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white">
                इस चुनी गई अवधि में कोई पूर्ण कार्य नहीं है
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                ऊपर से दूसरी अवधि (जैसे 'शुरू से अब तक') चुनकर देखें।
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
