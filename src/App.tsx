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
import { HistoryView } from './components/HistoryView';
import { SkeletonCard } from './components/SkeletonCard';
import { isToday } from './lib/dateUtils';
import { Plus, Search, Layers, X } from 'lucide-react';

export default function App() {
  // Navigation: Default tab is 'view' (shows pending/active cards)
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

  // PROGRESSIVE STAGED LOADING:
  // ONLY active list view items are processed on initial boot!
  // History is strictly on-demand when user clicks a duration in History tab.
  useEffect(() => {
    if (!currentUser) {
      setAllTodos([]);
      setRenderedTodos([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    storageService.loadTodos(currentUser.id).then(res => {
      if (!isMounted) return;

      const loaded = res.todos;
      setAllTodos(loaded);
      setSyncState(res.syncState);

      // Active items only for the list view
      const activeItems = loaded.filter(t => !t.completed);
      const todayIncomplete = activeItems.filter(t => isToday(t.createdAt));
      const otherIncomplete = activeItems.filter(t => !isToday(t.createdAt));

      // 1. Immediately render Today's incomplete items first, then others
      setRenderedTodos(activeItems.length > 0 ? [...todayIncomplete, ...otherIncomplete] : []);
      setIsLoading(false);
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

  const handleRestoreTodo = async (todo: TodoItem) => {
    // Unmark as completed and bring back to active view
    const restoredTodo: TodoItem = {
      ...todo,
      completed: false,
      subtasks: (todo.subtasks || []).map(s => ({ ...s, completed: false })),
      updatedAt: Date.now(),
    };
    await handleSaveTodo(restoredTodo);
    setActiveTab('view');
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

  // Completed items specifically for History tab
  const completedTodos = useMemo(() => {
    return allTodos.filter(t => t.completed);
  }, [allTodos]);

  // Main View lists: Strictly active/pending lists, prioritized:
  // 1st: Today's incomplete (aaj ke bache huye kam)
  // 2nd: Other days' incomplete (baaki dinon ke bache huye kam)
  const activeTodosForView = useMemo(() => {
    const list = renderedTodos.filter(todo => {
      // Filter out completed lists from main view (they go to History!)
      if (todo.completed) return false;

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

    // PRIORITY SORTING:
    // 1st: Today's incomplete (isToday === true && !completed)
    // 2nd: Other days' incomplete (isToday === false && !completed)
    return list.sort((a, b) => {
      const aIsToday = isToday(a.createdAt);
      const bIsToday = isToday(b.createdAt);

      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      return b.createdAt - a.createdAt;
    });
  }, [renderedTodos, searchQuery, filterType]);

  const todayIncompleteCount = allTodos.filter(t => isToday(t.createdAt) && !t.completed).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      
      {/* Top Navbar: Clean Icon Navigation with History */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        syncState={syncState}
        completedCount={completedTodos.length}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 pb-24">
        
        {/* TAB 1: VIEW (Default screen - Today's incomplete first, then other days' incomplete) */}
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
                  बाकी काम ({allTodos.filter(t => !t.completed).length})
                </button>

                {/* Today's Incomplete Focus Filter */}
                <button
                  onClick={() => setFilterType('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    filterType === 'today'
                      ? 'bg-zinc-100 text-zinc-950 font-bold'
                      : 'text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>आज के बाकी ({todayIncompleteCount})</span>
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

            {/* Direct Cards Grid: Skeleton during loading */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : activeTodosForView.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {activeTodosForView.map(todo => (
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
                  {completedTodos.length > 0 
                    ? 'सभी काम पूरे हो चुके हैं! (हिस्ट्री में देखें)' 
                    : (filterType === 'today' ? 'आज का कोई बाकी काम नहीं है' : 'कोई सक्रिय लिस्ट नहीं है')}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {completedTodos.length > 0 
                    ? 'आपके पूरे किए गए काम ऊपर "हिस्ट्री" टैब में सुरक्षित हैं।' 
                    : 'नीचे + बटन से अपनी नयी लिस्ट बनाएं।'}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={handleOpenDirectSamanAdd}
                    className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ सामान जोड़ें</span>
                  </button>
                  {completedTodos.length > 0 && (
                    <button
                      onClick={() => setActiveTab('history')}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl text-xs transition-colors"
                    >
                      हिस्ट्री देखें ({completedTodos.length})
                    </button>
                  )}
                </div>
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

        {/* TAB 4: HISTORY (Dedicated On-Demand View: 30 days / 6 months / all) */}
        {activeTab === 'history' && (
          <HistoryView
            getCompletedTodos={() => allTodos.filter(t => t.completed)}
            onRestoreTodo={handleRestoreTodo}
            onDeleteTodo={handleDeleteTodo}
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
