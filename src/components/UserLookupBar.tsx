import React, { useState, useEffect } from 'react';
import { Search, RotateCw, Filter, User, History, X, ArrowLeft } from 'lucide-react';

interface UserLookupBarProps {
  initialUserId?: string;
  onSearch: (userId: string, appOrderId?: string) => void;
  loading: boolean;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  statusCounts?: Record<string, number>;
  onBackToDirectory?: () => void;
}

const STORAGE_KEY = 'oms_recent_users';
const DEFAULT_USERS = ['MAA095', 'SAA074'];

export const UserLookupBar: React.FC<UserLookupBarProps> = ({
  initialUserId = 'MAA095',
  onSearch,
  loading,
  activeFilter,
  onFilterChange,
  statusCounts,
  onBackToDirectory,
}) => {
  const [userId, setUserId] = useState(initialUserId);
  const [appOrderId, setAppOrderId] = useState('');

  // Load recent users from localStorage
  const [recentUsers, setRecentUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_USERS;
  });

  // Sync if initialUserId changes
  useEffect(() => {
    if (initialUserId) {
      setUserId(initialUserId);
    }
  }, [initialUserId]);

  const addRecentUser = (uid: string) => {
    const clean = uid.trim().toUpperCase();
    if (!clean) return;
    setRecentUsers((prev) => {
      const filtered = prev.filter((u) => u.toUpperCase() !== clean);
      const updated = [clean, ...filtered].slice(0, 8); // Keep up to 8 users
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentUsers = () => {
    setRecentUsers([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = userId.trim();
    if (clean) {
      addRecentUser(clean);
      onSearch(clean, appOrderId.trim() || undefined);
    }
  };

  const handleSelectUser = (uid: string) => {
    setUserId(uid);
    addRecentUser(uid);
    onSearch(uid, appOrderId.trim() || undefined);
  };

  const filters = ['ALL', 'ARMED', 'FILLED', 'PLACED', 'EXITED', 'PENDING', 'CANCELLED'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
      {/* Top row: Back to Directory & Search Form */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {onBackToDirectory && (
          <button
            type="button"
            onClick={onBackToDirectory}
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 rounded-lg transition shadow-xs cursor-pointer shrink-0"
            title="Return to Users Directory"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Order History</span>
          </button>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter Trader User ID (e.g. MAA095, SAA074) *"
              required
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={appOrderId}
              onChange={(e) => setAppOrderId(e.target.value)}
              placeholder="Optional Order Ref (Symphony App Order ID or OMSLEG-ID)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !userId.trim()}
            className="inline-flex items-center justify-center px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg shadow-sm transition cursor-pointer shrink-0"
          >
            {loading ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Search className="w-3.5 h-3.5 mr-1.5" />
            )}
            Fetch Orders
          </button>
        </form>
      </div>

      {/* Dynamic Recent Searches & Status Filter Chips */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 pt-2 border-t border-slate-800/80">
        {/* Recent Searches */}
        <div className="flex items-center space-x-1.5 text-xs flex-wrap gap-y-1.5">
          <div className="flex items-center text-slate-500 mr-1 text-[11px]">
            <History className="w-3.5 h-3.5 mr-1 text-slate-400" /> Recent:
          </div>
          {recentUsers.map((uid) => (
            <button
              key={uid}
              type="button"
              onClick={() => handleSelectUser(uid)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                userId.trim().toUpperCase() === uid.toUpperCase()
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-950 text-indigo-300 hover:bg-slate-800 border border-slate-800'
              }`}
              title={`Switch to trader ${uid}`}
            >
              {uid}
            </button>
          ))}
          {recentUsers.length > 0 && (
            <button
              type="button"
              onClick={clearRecentUsers}
              className="text-[10px] text-slate-500 hover:text-slate-300 ml-1 p-0.5 rounded hover:bg-slate-800 transition"
              title="Clear recent user history"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filter Chips with Live Count Badges */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs shrink-0 pt-1 md:pt-0">
          <div className="flex items-center text-slate-500 mr-1 text-[11px]">
            <Filter className="w-3.5 h-3.5 mr-1" /> Status:
          </div>
          {filters.map((f) => {
            const count = statusCounts ? statusCounts[f] ?? 0 : null;
            const isSelected = activeFilter.toUpperCase() === f.toUpperCase();

            return (
              <button
                key={f}
                type="button"
                onClick={() => onFilterChange(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{f}</span>
                {count !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-none ${
                      isSelected
                        ? 'bg-white/25 text-white font-bold'
                        : count > 0
                        ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-bold'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
