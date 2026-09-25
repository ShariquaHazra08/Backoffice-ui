import React, { useState } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  Activity,
  ArrowRight,
  Clock,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import type { UserSummary } from '../types/oms';

interface UserDirectoryProps {
  users: UserSummary[];
  loading: boolean;
  onSelectUser: (userId: string) => void;
  onRefresh: () => void;
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({
  users,
  loading,
  onSelectUser,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      u.user_id.toLowerCase().includes(q) ||
      u.client_id.toLowerCase().includes(q)
    );
  });

  const totalArmedLegs = users.reduce((sum, u) => sum + (u.armed_legs_count || 0), 0);
  const totalOrders = users.reduce((sum, u) => sum + (u.total_orders || 0), 0);
  const activeUsersCount = users.filter((u) => (u.armed_legs_count || 0) > 0).length;

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'medium',
        hour12: false,
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono">Total Traders</p>
            <p className="text-xl font-bold text-white font-mono">{users.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono">Traders With Armed Legs</p>
            <p className="text-xl font-bold text-emerald-400 font-mono">
              {activeUsersCount} <span className="text-xs text-slate-500 font-normal">({totalArmedLegs} armed legs)</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono">Total OMS Orders</p>
            <p className="text-xl font-bold text-purple-300 font-mono">{totalOrders}</p>
          </div>
        </div>
      </div>

      {/* Directory Search & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter traders by User ID or Client ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition shadow-xs cursor-pointer w-full sm:w-auto justify-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const hasArmed = (u.armed_legs_count || 0) > 0;

          return (
            <div
              key={u.user_id}
              onClick={() => onSelectUser(u.user_id)}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-600/70 rounded-xl p-5 shadow-lg transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
            >
              {/* Highlight bar on card when armed */}
              {hasArmed && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500" />
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-950 border border-indigo-800/80 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs group-hover:border-indigo-500 transition">
                      {u.user_id.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                        {u.user_id}
                        {hasArmed && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Armed Legs" />
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Client: <span className="text-slate-300">{u.client_id}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                      hasArmed
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {hasArmed ? `${u.armed_legs_count} ARMED` : 'IDLE'}
                  </span>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">ARMED</span>
                    <span className={`font-bold ${hasArmed ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {u.armed_legs_count || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">FILLED</span>
                    <span className="font-bold text-blue-400">{u.filled_legs_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">TOTAL</span>
                    <span className="font-bold text-white">{u.total_orders || 0}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center text-slate-500 font-mono">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(u.last_active)}
                </span>
                <span className="inline-flex items-center text-indigo-400 font-semibold group-hover:text-indigo-300 group-hover:translate-x-0.5 transition">
                  Manage Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
          <ShieldCheck className="w-8 h-8 mx-auto text-slate-500 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Traders Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            No accounts in the OMS database matched "{searchTerm}".
          </p>
        </div>
      )}
    </div>
  );
};
