import { TodoItem } from '../types/todo';
import { supabase } from '../lib/supabase';

const TODOS_STORAGE_PREFIX = 'taskflow_todos_';

export type SyncState = 'synced' | 'local_only' | 'syncing' | 'error';

export const storageService = {
  getLocalStorageKey(userId: string): string {
    return `${TODOS_STORAGE_PREFIX}${userId}`;
  },

  getLocalTodos(userId: string): TodoItem[] {
    try {
      const data = localStorage.getItem(this.getLocalStorageKey(userId));
      if (!data) return [];
      return JSON.parse(data) as TodoItem[];
    } catch (e) {
      console.error('Failed reading local todos:', e);
      return [];
    }
  },

  setLocalTodos(userId: string, todos: TodoItem[]) {
    try {
      localStorage.setItem(this.getLocalStorageKey(userId), JSON.stringify(todos));
    } catch (e) {
      console.error('Failed saving local todos:', e);
    }
  },

  /**
   * Initial starter lists illustrating both Saman List (with price & quantity)
   * and simple Task Checklist (pure check/uncheck without prices).
   */
  getInitialStarterTodos(userId: string): TodoItem[] {
    const now = Date.now();
    return [
      {
        id: 'saman_grocery_' + userId.slice(-4),
        userId,
        title: 'किराना सामान लिस्ट (Grocery & Ration)',
        color: 'amber',
        type: 'saman',
        priority: 'high',
        completed: false,
        category: 'सामान',
        createdAt: now - 3600000 * 4,
        updatedAt: now - 3600000 * 2,
        subtasks: [
          {
            id: 'sub_g1',
            title: 'आशीर्वाद आटा (10kg Bag)',
            completed: true,
            price: 430,
            quantity: 1,
            createdAt: now - 3600000 * 3,
          },
          {
            id: 'sub_g2',
            title: 'फॉर्च्यून सरसों तेल (1L)',
            completed: true,
            price: 145,
            quantity: 2,
            createdAt: now - 3600000 * 2,
          },
          {
            id: 'sub_g3',
            title: 'टाटा चाय प्रीमियम (500g)',
            completed: false,
            price: 260,
            quantity: 1,
            createdAt: now - 3600000,
          },
          {
            id: 'sub_g4',
            title: 'सफेद चीनी (Sugar 5kg)',
            completed: false,
            price: 210,
            quantity: 1,
            createdAt: now - 1800000,
          },
          {
            id: 'sub_g5',
            title: 'अमूल बटर (500g)',
            completed: false,
            price: 275,
            quantity: 1,
            createdAt: now - 900000,
          },
        ],
      },
      {
        id: 'todo_daily_' + userId.slice(-4),
        userId,
        title: 'दैनिक जरूरी कार्य (Daily Tasks)',
        color: 'emerald',
        type: 'checklist',
        priority: 'medium',
        completed: false,
        category: 'कार्य',
        createdAt: now - 3600000 * 10,
        updatedAt: now - 3600000 * 5,
        subtasks: [
          {
            id: 'sub_d1',
            title: 'सुबह 7 बजे 45 मिनट रनिंग व व्यायाम',
            completed: true,
            createdAt: now - 3600000 * 8,
          },
          {
            id: 'sub_d2',
            title: 'बिजली और वाई-फाई का बिल भुगतान करना',
            completed: false,
            createdAt: now - 3600000 * 6,
          },
          {
            id: 'sub_d3',
            title: 'मार्केट से जरूरी सामान खरीदकर लाना',
            completed: false,
            createdAt: now - 3600000 * 4,
          },
          {
            id: 'sub_d4',
            title: 'शाम को परिवार के साथ समय बिताना',
            completed: false,
            createdAt: now - 3600000 * 2,
          },
        ],
      },
    ];
  },

  async loadTodos(userId: string): Promise<{ todos: TodoItem[]; syncState: SyncState; errorMsg?: string }> {
    let local = this.getLocalTodos(userId);

    if (local.length === 0) {
      local = this.getInitialStarterTodos(userId);
      this.setLocalTodos(userId, local);
    }

    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { todos: local, syncState: 'local_only', errorMsg: error.message };
      }

      if (data && data.length > 0) {
        const remoteTodos: TodoItem[] = data.map(row => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          description: row.description || '',
          color: row.color || 'emerald',
          type: row.type === 'checklist' ? 'checklist' : 'saman',
          priority: row.priority || 'medium',
          completed: !!row.completed,
          category: row.category,
          subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
          createdAt: new Date(row.created_at || Date.now()).getTime(),
          updatedAt: new Date(row.updated_at || Date.now()).getTime(),
        }));

        this.setLocalTodos(userId, remoteTodos);
        return { todos: remoteTodos, syncState: 'synced' };
      } else if (local.length > 0) {
        this.syncAllToSupabase(userId, local).catch(console.warn);
        return { todos: local, syncState: 'synced' };
      }

      return { todos: local, syncState: 'synced' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return { todos: local, syncState: 'local_only', errorMsg: msg };
    }
  },

  async saveTodo(userId: string, todo: TodoItem): Promise<{ success: boolean; syncState: SyncState }> {
    const local = this.getLocalTodos(userId);
    const index = local.findIndex(t => t.id === todo.id);

    if (index >= 0) {
      local[index] = todo;
    } else {
      local.unshift(todo);
    }
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
};
