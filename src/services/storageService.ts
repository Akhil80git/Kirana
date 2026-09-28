import { TodoItem } from '../types/todo';
import { supabase } from '../lib/supabase';

const TODOS_STORAGE_PREFIX = 'taskflow_todos_';

export type SyncState = 'synced' | 'local_only' | 'syncing' | 'error';

// IN-MEMORY CACHE (0ms instant access across tab switches)
const memoryCache = new Map<string, TodoItem[]>();
const hasInitialFetched = new Set<string>();

export const storageService = {
  getLocalStorageKey(userId: string): string {
    return `${TODOS_STORAGE_PREFIX}${userId}`;
  },

  getLocalTodos(userId: string): TodoItem[] {
    // 1. Check ultra-fast In-Memory cache first (0ms)
    if (memoryCache.has(userId)) {
      return memoryCache.get(userId)!;
    }

    // 2. Fallback to LocalStorage
    try {
      const data = localStorage.getItem(this.getLocalStorageKey(userId));
      if (!data) return [];
      const parsed = JSON.parse(data) as TodoItem[];
      const clean = parsed.filter(t => !t.id.startsWith('saman_grocery_') && !t.id.startsWith('todo_daily_'));
      memoryCache.set(userId, clean);
      return clean;
    } catch (e) {
      console.error('Failed reading local todos:', e);
      return [];
    }
  },

  setLocalTodos(userId: string, todos: TodoItem[]) {
    // Update both In-Memory cache and LocalStorage synchronously
    memoryCache.set(userId, todos);
    try {
      localStorage.setItem(this.getLocalStorageKey(userId), JSON.stringify(todos));
    } catch (e) {
      console.error('Failed saving local todos:', e);
    }
  },

  /**
   * Load Todos with intelligent caching:
   * - If already loaded in memory and forceRefresh is false, returns INSTANTLY (0ms, 0 API calls).
   * - If first load, immediately serves cached data to UI, then syncs with Supabase in background.
   */
  async loadTodos(userId: string, forceRefresh = false): Promise<{ todos: TodoItem[]; syncState: SyncState; errorMsg?: string }> {
    const cached = this.getLocalTodos(userId);

    // If already in memory and not forcing refresh, return immediately without any network call
    if (hasInitialFetched.has(userId) && !forceRefresh && cached.length > 0) {
      return { todos: cached, syncState: 'synced' };
    }

    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        hasInitialFetched.add(userId);
        return { todos: cached, syncState: 'local_only', errorMsg: error.message };
      }

      if (data && data.length > 0) {
        const remoteTodos: TodoItem[] = data
          .filter(row => !row.id.startsWith('saman_grocery_') && !row.id.startsWith('todo_daily_'))
          .map(row => ({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            description: row.description || '',
            color: row.color || 'emerald',
            type: row.type === 'checklist' ? 'checklist' : row.type === 'ecommerce' ? 'ecommerce' : 'saman',
            priority: row.priority || 'medium',
            completed: !!row.completed,
            category: row.category,
            subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
            createdAt: new Date(row.created_at || Date.now()).getTime(),
            updatedAt: new Date(row.updated_at || Date.now()).getTime(),
          }));

        this.setLocalTodos(userId, remoteTodos);
        hasInitialFetched.add(userId);
        return { todos: remoteTodos, syncState: 'synced' };
      } else if (cached.length > 0) {
        this.syncAllToSupabase(userId, cached).catch(console.warn);
        hasInitialFetched.add(userId);
        return { todos: cached, syncState: 'synced' };
      }

      hasInitialFetched.add(userId);
      return { todos: cached, syncState: 'synced' };
    } catch (err: unknown) {
      hasInitialFetched.add(userId);
      const msg = err instanceof Error ? err.message : 'Network error';
      return { todos: cached, syncState: 'local_only', errorMsg: msg };
    }
  },

  async saveTodo(userId: string, todo: TodoItem): Promise<{ success: boolean; syncState: SyncState }> {
    const local = [...this.getLocalTodos(userId)];
    const index = local.findIndex(t => t.id === todo.id);

    if (index >= 0) {
      local[index] = todo;
    } else {
      local.unshift(todo);
    }
    // Update memory & local cache immediately
    this.setLocalTodos(userId, local);

    try {
      const payload = {
        id: todo.id,
        user_id: userId,
        title: todo.title,
        color: todo.color,
        type: todo.type,
        priority: todo.priority,
        completed: todo.completed,
        category: todo.category || null,
        subtasks: todo.subtasks,
        created_at: new Date(todo.createdAt).toISOString(),
        updated_at: new Date(todo.updatedAt).toISOString(),
      };

      const { error } = await supabase.from('todos').upsert(payload);
      if (error) {
        return { success: true, syncState: 'local_only' };
      }
      return { success: true, syncState: 'synced' };
    } catch {
      return { success: true, syncState: 'local_only' };
    }
  },

  async deleteTodo(userId: string, todoId: string): Promise<boolean> {
    const local = this.getLocalTodos(userId);
    const updated = local.filter(t => t.id !== todoId);
    this.setLocalTodos(userId, updated);

    try {
      await supabase.from('todos').delete().eq('id', todoId).eq('user_id', userId);
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
    return true;
  },

  async syncAllToSupabase(userId: string, todos: TodoItem[]): Promise<boolean> {
    if (!todos || todos.length === 0) return true;
    try {
      const rows = todos.map(todo => ({
        id: todo.id,
        user_id: userId,
        title: todo.title,
        color: todo.color,
        type: todo.type,
        priority: todo.priority,
        completed: todo.completed,
        category: todo.category || null,
        subtasks: todo.subtasks,
        created_at: new Date(todo.createdAt).toISOString(),
        updated_at: new Date(todo.updatedAt).toISOString(),
      }));

      const { error } = await supabase.from('todos').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  clearMemoryCache() {
    memoryCache.clear();
    hasInitialFetched.clear();
  }
};
