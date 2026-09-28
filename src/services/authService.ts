import { AppUser } from '../types/todo';
import { supabase } from '../lib/supabase';

const CURRENT_USER_KEY = 'taskflow_current_user';
const LOCAL_USERS_KEY = 'taskflow_users_db';

interface StoredUser extends AppUser {
  passwordHash: string;
}

// Simple fast client hash for demo/applet persistence
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

export const authService = {
  getCurrentUser(): AppUser | null {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      if (!data) return null;
      return JSON.parse(data) as AppUser;
    } catch {
      return null;
    }
  },

  getAllLocalUsers(): StoredUser[] {
    try {
      const data = localStorage.getItem(LOCAL_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveUserLocal(user: StoredUser) {
    const users = this.getAllLocalUsers();
    const existingIndex = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  },

  async register(username: string, password: string, displayName?: string): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters' };
    }

    const localUsers = this.getAllLocalUsers();
    if (localUsers.some(u => u.username.toLowerCase() === cleanUser)) {
      return { success: false, error: 'Username already exists. Please login instead.' };
    }

    const newUser: StoredUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: cleanUser,
      displayName: displayName?.trim() || cleanUser,
      createdAt: Date.now(),
      passwordHash: hashPassword(password),
    };

    // Save locally
    this.saveUserLocal(newUser);
    const publicUser: AppUser = {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      createdAt: newUser.createdAt,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(publicUser));

    // Try Supabase sync in background (if app_users table exists)
    try {
      await supabase.from('app_users').insert({
        id: newUser.id,
        username: newUser.username,
        display_name: newUser.displayName,
        created_at: new Date(newUser.createdAt).toISOString(),
      });
    } catch (e) {
      // Non-blocking: local works seamlessly
      console.warn('Supabase app_users table sync skipped or pending:', e);
    }

    return { success: true, user: publicUser };
  },

  async login(username: string, password: string): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password) {
      return { success: false, error: 'Please enter both username and password' };
    }

    const localUsers = this.getAllLocalUsers();
    const found = localUsers.find(u => u.username.toLowerCase() === cleanUser);

    if (!found) {
      // Check if user exists in Supabase
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('*')
          .eq('username', cleanUser)
          .single();

        if (data && !error) {
          const syncedUser: AppUser = {
            id: data.id,
            username: data.username,
            displayName: data.display_name || data.username,
            createdAt: new Date(data.created_at || Date.now()).getTime(),
          };
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(syncedUser));
          return { success: true, user: syncedUser };
        }
      } catch (err) {
        console.warn('Supabase auth check fallback:', err);
      }

      return { success: false, error: 'User not found. Please register first.' };
    }

    const targetHash = hashPassword(password);
    if (found.passwordHash !== targetHash) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const publicUser: AppUser = {
      id: found.id,
      username: found.username,
      displayName: found.displayName,
      createdAt: found.createdAt,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(publicUser));

    return { success: true, user: publicUser };
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },
};
