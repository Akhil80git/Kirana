import React, { useState } from 'react';
import { ActiveTab, AppUser } from '../types/todo';
import { SyncState } from '../services/storageService';
import { 
  CheckSquare, 
  LayoutGrid, 
  BarChart3, 
  Cloud, 
  LogOut, 
  User as UserIcon,
  Database,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: AppUser | null;
  syncState: SyncState;
  onOpenSupabaseModal: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  syncState,
  onOpenSupabaseModal,
  onLogout,
  onOpenAuth,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 transition-all">
      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Main 3 Navigation Icon Tabs (Clean minimal neutral aesthetic) */}
          <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl gap-1">
            
            {/* 1. View Icon (Default tab: Shows all cards) */}
            <button
              type="button"
              onClick={() => onTabChange('view')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'view'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="लिस्ट देखें"
            >
              <CheckSquare className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden xs:inline">लिस्ट</span>
            </button>

            {/* 2. Template Icon */}
            <button
              type="button"
              onClick={() => onTabChange('templates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'templates'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="नया जोड़ें (Templates & Add)"
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden xs:inline">जोड़ें</span>
            </button>

            {/* 3. Analytics Icon */}
            <button
              type="button"
              onClick={() => onTabChange('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="एनालिटिक्स"
            >
              <BarChart3 className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden xs:inline">हिसाब</span>
            </button>

          </div>

          {/* Right minimal status & profile */}
          <div className="flex items-center gap-2">
            
            {/* Supabase status minimal button */}
            <button
              onClick={onOpenSupabaseModal}
              title="Supabase Cloud Status"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              {syncState === 'synced' ? (
                <Cloud className="w-4 h-4 text-emerald-400" />
              ) : (
                <Database className="w-4 h-4 text-sky-400" />
              )}
            </button>

            {/* User profile dropdown - Logout is strictly inside profile click */}
            {currentUser ? (
              <div className="relative pl-1">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 hover:border-zinc-500 flex items-center justify-center font-bold text-xs text-zinc-200 uppercase transition-colors"
                  title="Profile Menu"
                >
                  {currentUser.username[0]}
                </button>

                {profileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setProfileOpen(false)} 
                    />
                    <div className="absolute right-0 top-10 z-40 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 text-xs text-zinc-200">
                      <div className="px-2.5 py-2 border-b border-zinc-800">
                        <p className="font-bold text-white truncate">
                          {currentUser.displayName || currentUser.username}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          @{currentUser.username}
                        </p>
                      </div>

                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg font-medium transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>लॉगआउट (Logout)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
              >
                Login
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
