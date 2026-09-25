import React from 'react';
import { Layers, Settings, RefreshCw, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  onRefresh: () => void;
  loading: boolean;
  activeCount: number;
  isBackendHealthy: boolean;
  currentView?: 'HISTORY' | 'ORDERS' | 'DIRECTORY';
  onNavigateDirectory?: () => void;
  selectedUserId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onRefresh,
  loading,
  activeCount,
  isBackendHealthy,
  currentView = 'HISTORY',
  onNavigateDirectory,
  selectedUserId,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & View Navigation */}
        <div className="flex items-center space-x-3">
          <div
            onClick={onNavigateDirectory}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-900/30 cursor-pointer"
            title="Go to Master Order History"
          >
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                onClick={onNavigateDirectory}
                className="text-base font-bold text-white tracking-tight flex items-center gap-2 cursor-pointer hover:text-indigo-300 transition"
              >
                FirstDemat Backoffice
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-semibold">
                Live OMS
              </span>
              {currentView === 'ORDERS' && selectedUserId && (
                <span className="hidden md:inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Trader: <strong className="text-white ml-1">{selectedUserId}</strong>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {currentView === 'HISTORY'
                ? 'Global Master Order History & Live Feed'
                : 'RMS & Operations Order Intervention Portal'}
            </p>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center space-x-3">
          {/* View Directory Quick Switcher */}
          {currentView === 'ORDERS' && onNavigateDirectory && (
            <button
              onClick={onNavigateDirectory}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition shadow-xs cursor-pointer"
              title="Return to Master Order History"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Order History</span>
            </button>
          )}

          {/* Real Backend Health Status */}
          <div
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
              isBackendHealthy
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800'
                : 'bg-rose-950/50 text-rose-300 border-rose-800'
            }`}
            title={isBackendHealthy ? 'OMS Worker backend is online and responding' : 'OMS Worker unreachable (:8089)'}
          >
            {isBackendHealthy ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">OMS Online (:8089)</span>
                <span className="sm:hidden">Online</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>OMS Offline</span>
              </>
            )}
          </div>

          {/* Active Orders Count */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Active:</span>
            <span className="font-bold text-white">{activeCount}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
            title="Refresh from OMS"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Connection</span>
          </button>
        </div>
      </div>
    </header>
  );
};
