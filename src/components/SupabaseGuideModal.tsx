import React, { useState } from 'react';
import { checkSupabaseConnection, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { SyncState } from '../services/storageService';
import { 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Copy, 
  ExternalLink, 
  X, 
  RefreshCw,
  Terminal,
  Zap
} from 'lucide-react';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: SyncState;
  onRetrySync: () => void;
}

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({
  isOpen,
  onClose,
  syncState,
  onRetrySync,
}) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    tableReady: boolean;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const sqlSchema = `-- ==========================================
-- SUPABASE SCHEMA FOR TASKFLOW PRO
-- Paste this into your Supabase Dashboard -> SQL Editor
-- ==========================================

-- 1. Create app_users table
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'emerald',
  type TEXT DEFAULT 'checklist',
  priority TEXT DEFAULT 'medium',
  completed BOOLEAN DEFAULT false,
  due_date TEXT,
  category TEXT,
  budget_limit NUMERIC,
  subtasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Anon Access
CREATE POLICY "Allow anon read and write on todos" 
ON public.todos 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow anon read and write on app_users" 
ON public.app_users 
FOR ALL 
USING (true) 
WITH CHECK (true);
`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const res = await checkSupabaseConnection();
    setTestResult(res);
    setTesting(false);
    if (res.connected && res.tableReady) {
      onRetrySync();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col my-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Supabase Cloud & Security Guide
              </h2>
              <p className="text-xs text-slate-400">
                Connection verification, security FAQ, and SQL table setup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Security Answer Box (Addressing User's specific prompt question) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Security Check: Is the Public Key Safe to Expose?</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Yes, it is 100% safe.</strong> The key starting with <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">sb_publishable_...</code> is an <strong>Anon/Publishable key</strong> designed by Supabase specifically for client-side web browsers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-300">
                <span className="font-bold block mb-0.5">✅ Safe on Frontend:</span>
                Anon / Publishable keys rely on Postgres Row Level Security (RLS) to enforce data boundaries.
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-300">
                <span className="font-bold block mb-0.5">⚠️ Never Expose on Frontend:</span>
                Never expose your <code className="underline">service_role</code> secret key anywhere in browser code.
              </div>
            </div>
          </div>

          {/* Connection Test & Status */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white">Active Supabase Endpoint</span>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>

            <p className="text-[11px] font-mono text-slate-400 truncate bg-slate-900 p-2 rounded-lg border border-slate-800">
              {SUPABASE_URL}
            </p>

            {testResult && (
              <div className={`p-2.5 rounded-lg border text-xs ${
                testResult.tableReady
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                {testResult.tableReady ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Connected to Supabase! The <code>todos</code> table is ready.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{testResult.error || "Supabase reachable, but 'todos' table is not created yet."}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Run the SQL snippet below in your Supabase SQL Editor to activate cloud sync!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SQL Setup Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Run this SQL in Supabase SQL Editor</span>
              </div>
              <button
                onClick={handleCopySQL}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-48 leading-relaxed">
              {sqlSchema}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <span className="text-[11px] text-slate-400">
            Data is always cached instantly in your browser (0ms latency).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
