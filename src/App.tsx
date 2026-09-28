import React, { useState, useEffect, useMemo } from 'react';
import { TodoItem, AppUser, TodoType, ActiveTab } from './types/todo';
import { authService } from './services/authService';
import { storageService, SyncState } from './services/storageService';
import { Header } from './components/Header';
import { TodoCard } from './components/TodoCard';
import { TodoModal } from './components/TodoModal';
import { AuthModal } from './components/AuthModal';
import { SupabaseGuideModal } from './components/SupabaseGuideModal';
import { ShareListModal } from './components/ShareListModal';
import { TemplatesView } from './components/TemplatesView';
import { AnalyticsView } from './components/AnalyticsView';
import { isToday } from './lib/dateUtils';
import { Plus, Search, Layers, X } from 'lucide-react';

export default function App() {
  // Navigation: Default tab is 'view' (shows all cards)
  const [activeTab, setActiveTab] = useState<ActiveTab>('view');

  // Authentication & Persistent User Session
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Todos & Progressive Loading State
  const [allTodos, setAllTodos] = useState<TodoItem[]>([]);
  const [renderedTodos, setRenderedTodos] = useState<TodoItem[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const [isLoading, setIsLoading] = useState(true);

  // Quick Search & Minimal Status Filter for View Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'today' | 'saman' | 'checklist'>('all');

  // Modals
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<TodoType>('saman');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [sharingTodo, setSharingTodo] = useState<TodoItem | null>(null);

  // Auto-Login
  useEffect(() => {
    if (!currentUser) {
      const allUsers = authService.getAllLocalUsers();
      if (allUsers.length > 0) {
        const lastUser = allUsers[allUsers.length - 1];
        const userObj: AppUser = {
          id: lastUser.id,
          username: lastUser.username,
          displayName: lastUser.displayName,
          createdAt: lastUser.createdAt,
        };
        localStorage.setItem('taskflow_current_user', JSON.stringify(userObj));
        setCurrentUser(userObj);
      } else {
        setIsAuthModalOpen(true);
      }
      setIsLoading(false);
    }
  }, [currentUser]);

  // PROGRESSIVE / STAGED LOADING:
  // Step 1: Render Today's items immediately (0ms delay)
  // Step 2: Stream in older items smoothly without freezing UI
  useEffect(() => {
    if (!currentUser) {
      setAllTodos([]);
      setRenderedTodos([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    storageService.loadTodos(currentUser.id).then(res => {
      if (!isMounted) return;

      const loaded = res.todos;
      setAllTodos(loaded);
      setSyncState(res.syncState);

      // Separate today's items from older items
      const todayItems = loaded.filter(t => isToday(t.createdAt));
      const olderItems = loaded.filter(t => !isToday(t.createdAt));

      // 1. Immediately render Today's items
      setRenderedTodos(todayItems.length > 0 ? todayItems : loaded.slice(0, 4));
      setIsLoading(false);

      // 2. Automatically load all remaining items smoothly
      if (olderItems.length > 0) {
        const timer = setTimeout(() => {
          if (isMounted) {
            setRenderedTodos(loaded);
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Auth Handlers
  const handleAuthSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setAllTodos([]);
    setRenderedTodos([]);
    setIsAuthModalOpen(true);
  };

  // Todo CRUD Handlers
  const handleSaveTodo = async (todoData: TodoItem) => {
    if (!currentUser) return;

    const updater = (prev: TodoItem[]) => {
      const idx = prev.findIndex(t => t.id === todoData.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = todoData;
        return copy;
      }
      return [todoData, ...prev];
    };

    setAllTodos(updater);
    setRenderedTodos(updater);

    setSyncState('syncing');
    const res = await storageService.saveTodo(currentUser.id, todoData);
    setSyncState(res.syncState);
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!currentUser) return;
    setAllTodos(prev => prev.filter(t => t.id !== todoId));
    setRenderedTodos(prev => prev.filter(t => t.id !== todoId));
    await storageService.deleteTodo(currentUser.id, todoId);
  };

  const handleUpdateTodoCard = async (updatedTodo: TodoItem) => {
    if (!currentUser) return;
    const updater = (prev: TodoItem[]) => prev.map(t => (t.id === updatedTodo.id ? updatedTodo : t));
    setAllTodos(updater);
    setRenderedTodos(updater);
    const res = await storageService.saveTodo(currentUser.id, updatedTodo);
    setSyncState(res.syncState);
  };

  const handleOpenEditModal = (todo: TodoItem) => {
    setEditingTodo(todo);
    setModalDefaultType(todo.type);
    setIsTodoModalOpen(true);
  };

  const handleOpenDirectSamanAdd = () => {
    setEditingTodo(null);
    setModalDefaultType('saman');
    setIsTodoModalOpen(true);
  };

  const handleOpenDirectTypeAdd = (type: TodoType) => {
    setEditingTodo(null);
    setModalDefaultType(type);
    setIsTodoModalOpen(true);
  };

  const handleRetrySync = async () => {
    if (!currentUser) return;
    setSyncState('syncing');
    const res = await storageService.loadTodos(currentUser.id);
    setAllTodos(res.todos);
    setRenderedTodos(res.todos);
    setSyncState(res.syncState);
  };

  // Filter & Prioritize Today's cards
  const displayTodos = useMemo(() => {
    const list = renderedTodos.filter(todo => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = todo.title.toLowerCase().includes(q);
        const matchSub = (todo.subtasks || []).some(s => s.title.toLowerCase().includes(q));
        if (!matchTitle && !matchSub) return false;
      }

      if (filterType === 'today') {
        return isToday(todo.createdAt);
      }
      if (filterType === 'saman') {
        return todo.type === 'saman' || todo.type === 'ecommerce';
      }
      if (filterType === 'checklist') {
        return todo.type === 'checklist';
      }

      return true;
    });

    // Today's items appear first
    return list.sort((a, b) => {
      const aIsToday = isToday(a.createdAt);
      const bIsToday = isToday(b.createdAt);
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [renderedTodos, searchQuery, filterType]);

  const todayCount = allTodos.filter(t => isToday(t.createdAt)).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      
      {/* Top Navbar: Clean Icon Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        syncState={syncState}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 pb-24">
        
        {/* TAB 1: VIEW (Default screen - Direct Cards Only) */}
        {activeTab === 'view' && (
          <div className="space-y-4">
            
            {/* Minimal Filter Row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    filterType === 'all'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  सभी ({allTodos.length})
                </button>

                {/* Today's Focus Filter */}
                <button
                  onClick={() => setFilterType('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    filterType === 'today'
                      ? 'bg-zinc-100 text-zinc-950 font-bold'
                      : 'text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>आज ({todayCount})</span>
                </button>

                <button
                  onClick={() => setFilterType('saman')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    filterType === 'saman'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  सामान & प्राइस
                </button>

                <button
                  onClick={() => setFilterType('checklist')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    filterType === 'checklist'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  टास्क
                </button>
              </div>

              {/* Compact Search */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="खोजें..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
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

            {/* Direct Cards Grid */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-zinc-400">लोड हो रहा है...</p>
              </div>
            ) : displayTodos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {displayTodos.map(todo => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onUpdate={handleUpdateTodoCard}
                    onDelete={handleDeleteTodo}
                    onEdit={handleOpenEditModal}
                    onShare={setSharingTodo}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center max-w-md mx-auto px-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                <Layers className="w-8 h-8 text-zinc-500 mx-auto mb-2.5" />
                <h3 className="text-sm font-bold text-white">
                  {filterType === 'today' ? 'आज की कोई लिस्ट नहीं है' : 'कोई लिस्ट नहीं मिली'}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  नीचे + बटन से तुरंत नया सामान या टास्क जोड़ें।
                </p>
                <button
                  onClick={handleOpenDirectSamanAdd}
                  className="mt-3.5 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ सामान जोड़ें</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: TEMPLATES (Direct clean add options) */}
        {activeTab === 'templates' && (
          <TemplatesView
            onSelectType={type => handleOpenDirectTypeAdd(type)}
          />
        )}

        {/* TAB 3: ANALYTICS & DEEP FILTERS */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            todos={allTodos}
            onUpdateTodo={handleUpdateTodoCard}
            onDeleteTodo={handleDeleteTodo}
            onEditTodo={handleOpenEditModal}
            onShareTodo={setSharingTodo}
          />
        )}

      </main>

      {/* Sleek Floating Add Button (Mobile & Desktop) */}
      <div className="fixed bottom-5 right-4 z-40">
        <button
          onClick={handleOpenDirectSamanAdd}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-xl active:scale-95 transition-transform cursor-pointer border border-zinc-300"
          title="सामान जोड़ें"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>सामान</span>
        </button>
      </div>

      {/* Modals */}
      <TodoModal
        isOpen={isTodoModalOpen}
        onClose={() => { setIsTodoModalOpen(false); setEditingTodo(null); }}
        onSave={handleSaveTodo}
        initialTodo={editingTodo}
        defaultType={modalDefaultType}
        userId={currentUser ? currentUser.id : 'guest'}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <SupabaseGuideModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        syncState={syncState}
        onRetrySync={handleRetrySync}
      />

      <ShareListModal
        isOpen={!!sharingTodo}
        onClose={() => setSharingTodo(null)}
        todo={sharingTodo}
      />

    </div>
  );
}
