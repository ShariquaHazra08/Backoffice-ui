import React from 'react';
import { Layers, RefreshCw, Activity } from 'lucide-react';

interface NavbarProps {
  onRefresh: () => void;
  loading: boolean;
  activeCount: number;
  isBackendHealthy: boolean;
  currentView?: 'HISTORY' | 'ORDERS' | 'DIRECTORY';
  onNavigateDirectory?: () => void;
  autoRefreshInterval: number;
  onAutoRefreshChange: (intervalMs: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  loading,
  activeCount,
  isBackendHealthy,
  currentView = 'HISTORY',
  onNavigateDirectory,
  autoRefreshInterval,
  onAutoRefreshChange,
}) => {
  return (
    <header className="shrink-0 border-b border-[#E6E8EC] bg-white z-30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 shrink-0 min-w-0">
          <div
            onClick={onNavigateDirectory}
            className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center cursor-pointer shrink-0"
            title="Go to Master Order History"
          >
            <Layers className="w-4 h-4 text-white" />
          </div>
            <div className="min-w-0">
              <h1
                onClick={onNavigateDirectory}
                className="text-[15px] font-semibold text-[#1A1D23] tracking-tight cursor-pointer hover:text-indigo-700 transition whitespace-nowrap"
              >
                OMS BackOffice
              </h1>
              <p className="text-[11px] text-[#6B7280] truncate">
              {currentView === 'HISTORY' ? 'Parent orders' : 'Order legs'}
            </p>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* View Directory Quick Switcher */}
          {currentView === 'ORDERS' && onNavigateDirectory && (
            <button
              onClick={onNavigateDirectory}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#EEF1F4] border border-[#E6E8EC] text-xs font-medium text-[#3A4250] hover:text-[#1A1D23] transition shadow-xs cursor-pointer"
              title="Return to Master Order History"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Order History</span>
            </button>
          )}

          {/* Real Backend Health Status */}
          <div
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-[#E6E8EC] bg-white text-[#5C6570]"
            title={isBackendHealthy ? 'OMS Backend is online and responding' : 'OMS Backend unreachable'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isBackendHealthy ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
            <span className="hidden lg:inline">{isBackendHealthy ? 'OMS live' : 'OMS offline'}</span>
            <span className="lg:hidden">{isBackendHealthy ? 'Live' : 'Offline'}</span>
          </div>

          {/* Active Orders Count */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-[#E6E8EC] rounded-lg text-xs font-mono text-[#3A4250]">
            <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden lg:inline">Active:</span>
            <span className="font-bold text-[#1A1D23]">{activeCount}</span>
          </div>

          {/* Auto Refresh Selector */}
          <div className="flex items-center space-x-1.5 bg-white border border-[#E6E8EC] rounded-lg px-2 sm:px-2.5 py-1 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                autoRefreshInterval > 0 ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span className="text-[11px] text-[#5C6570] hidden xl:inline">Auto:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => onAutoRefreshChange(Number(e.target.value))}
              className="bg-transparent text-[#1A1D23] text-xs font-mono focus:outline-hidden cursor-pointer"
              title="Auto-refresh interval"
            >
              <option value={10000} className="bg-white text-[#3A4250]">10s</option>
              <option value={30000} className="bg-white text-[#3A4250]">30s</option>
              <option value={60000} className="bg-white text-[#3A4250]">60s</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-[#E6E8EC] text-[#5C6570] hover:text-[#1A1D23] hover:bg-[#EEF1F4] transition shadow-xs cursor-pointer shrink-0"
            title="Refresh from OMS"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
