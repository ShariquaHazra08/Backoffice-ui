import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  CheckCircle2,
  Users,
  TrendingUp,
  ArrowRight,
  Copy,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import type { OrderHistoryRow, OrderHistoryStats, OrderHistoryPaginationMeta } from '../types/oms';
import { StatusBadge } from './StatusBadge';

interface OrderHistoryTableProps {
  orders: OrderHistoryRow[];
  pagination: OrderHistoryPaginationMeta;
  stats: OrderHistoryStats;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onSelectOrder: (order: OrderHistoryRow) => void;
  onRefresh: () => void;
  activeStatus: string;
  initialSearch?: string;
}

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({
  orders,
  pagination,
  stats,
  loading,
  onPageChange,
  onLimitChange,
  onStatusChange,
  onSearchChange,
  onSelectOrder,
  onRefresh,
  activeStatus,
  initialSearch = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Sync internal search with prop if external changes happen
  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const handleSearchInput = (val: string) => {
    setSearchTerm(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onSearchChange(val);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    onSearchChange('');
  };

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const formatTimestamp = (d?: string) => {
    if (!d) return { time: '-', date: '' };
    try {
      const dateObj = new Date(d);
      return {
        time: dateObj.toLocaleTimeString('en-IN', { hour12: false }),
        date: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      };
    } catch {
      return { time: d, date: '' };
    }
  };

  const formatPrice = (val: number) => {
    if (!val || val === 0) return '-';
    return `₹${val.toFixed(2)}`;
  };

  const { page, limit, totalRecords, totalPages } = pagination;
  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  const statusChips = [
    { label: 'ALL', count: stats.total },
    { label: 'ARMED', count: stats.armed, color: 'text-emerald-400 border-emerald-800 bg-emerald-950/40' },
    { label: 'FILLED', count: stats.filled, color: 'text-blue-400 border-blue-800 bg-blue-950/40' },
    { label: 'CANCELLED', count: stats.cancelled, color: 'text-slate-400 border-slate-700 bg-slate-900/60' },
    { label: 'PENDING', count: stats.pending, color: 'text-amber-400 border-amber-800 bg-amber-950/40' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Global Metrics Snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Total OMS Orders</p>
            <p className="text-xl font-bold text-white font-mono">{stats.total.toLocaleString()}</p>
          </div>
        </div>

        {/* Armed Orders (Active) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Armed in Market</p>
            <p className="text-xl font-bold text-emerald-400 font-mono">
              {stats.armed}{' '}
              <span className="text-[11px] text-slate-500 font-normal">orders live</span>
            </p>
          </div>
        </div>

        {/* Filled Today */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Filled Orders</p>
            <p className="text-xl font-bold text-blue-400 font-mono">{stats.filled.toLocaleString()}</p>
          </div>
        </div>

        {/* Active Traders */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Active Traders</p>
            <p className="text-xl font-bold text-purple-300 font-mono">
              {stats.active_traders}{' '}
              <span className="text-[11px] text-slate-500 font-normal">with armed legs</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar (Search + Status Tabs + Refresh) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search User ID (e.g. MAA095), Order ID, Instrument..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {statusChips.map((chip) => {
            const isActive = activeStatus === chip.label;
            return (
              <button
                key={chip.label}
                onClick={() => onStatusChange(chip.label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/30'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer border border-slate-700"
            title="Refresh order history"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. Paginated Order History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-sans">
            <thead className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Trader</th>
                <th className="py-3 px-4">OMS / Leg ID</th>
                <th className="py-3 px-4">Instrument</th>
                <th className="py-3 px-4">Role & Side</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Trigger / Stop</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-mono">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-indigo-400 animate-spin" />
                    Loading orders stream from OMS database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-white">No Orders Found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {searchTerm
                        ? `No orders matching "${searchTerm}" with status "${activeStatus}".`
                        : `No orders found with status "${activeStatus}".`}
                    </p>
                    {(searchTerm || activeStatus !== 'ALL') && (
                      <button
                        onClick={() => {
                          handleClearSearch();
                          onStatusChange('ALL');
                        }}
                        className="mt-3 px-3 py-1.5 text-xs bg-indigo-950 border border-indigo-700 text-indigo-300 rounded-lg hover:bg-indigo-900 transition cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const { time, date } = formatTimestamp(o.createdAt);
                  const isBuy = (o.entrySide || 'BUY').toUpperCase() === 'BUY';
                  const isArmed = (o.status || '').toUpperCase() === 'ARMED';

                  return (
                    <tr
                      key={o.omsLegID}
                      onClick={() => onSelectOrder(o)}
                      className={`group hover:bg-slate-800/60 transition cursor-pointer ${
                        isArmed ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* 1. Time */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        <span className="text-slate-200 block font-semibold">{time}</span>
                        <span className="text-slate-500 text-[10px]">{date}</span>
                      </td>

                      {/* 2. Trader */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-950 border border-indigo-800 flex items-center justify-center text-[10px] font-mono font-bold text-indigo-400 shrink-0">
                            {o.userID.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-white group-hover:text-indigo-400 transition block">
                              {o.userID}
                            </span>
                            {o.clientID && o.clientID !== o.userID && (
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {o.clientID}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Order IDs */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-300" title={`OMS Leg ID: ${o.omsLegID}`}>
                            {o.omsLegID}
                          </span>
                          <button
                            onClick={(e) => handleCopy(e, o.omsLegID.toString())}
                            className="text-slate-500 hover:text-slate-300 transition"
                            title="Copy Leg ID"
                          >
                            {copiedId === o.omsLegID.toString() ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Parent: {o.omsOrderID}
                        </span>
                      </td>

                      {/* 4. Instrument */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        <span className="text-indigo-300 font-semibold">{o.exchangeSegment}</span>
                        <span className="text-slate-300 block">{o.exchangeInstrumentID}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{o.productType}</span>
                      </td>

                      {/* 5. Role & Side */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isBuy
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {o.entrySide}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              o.legRole === 'SL'
                                ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                                : o.legRole === 'TARGET'
                                ? 'bg-indigo-950/70 text-indigo-300 border-indigo-800'
                                : 'bg-blue-950/70 text-blue-300 border-blue-800'
                            }`}
                          >
                            {o.legRole}
                          </span>
                        </div>
                      </td>

                      {/* 6. Qty */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        <span className="text-white font-semibold">{o.qty}</span>
                        {(o.filledQty ?? 0) > 0 && (
                          <span className="text-[10px] text-emerald-400 block">
                            Filled: {o.filledQty}
                          </span>
                        )}
                      </td>

                      {/* 7. Trigger / Stop Price */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        {o.triggerPrice > 0 ? (
                          <div>
                            <span className="text-amber-300 font-semibold">
                              {formatPrice(o.triggerPrice)}
                            </span>
                            {o.stopPrice > 0 && o.stopPrice !== o.triggerPrice && (
                              <span className="text-[10px] text-slate-500 block">
                                Stop: {formatPrice(o.stopPrice)}
                              </span>
                            )}
                            {o.trailPoints > 0 && (
                              <span className="text-[10px] text-indigo-400 block">
                                Trail: {o.trailPoints} pts
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">{o.orderType}</span>
                        )}
                      </td>

                      {/* 8. Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={o.status} />
                      </td>

                      {/* 9. Action Button */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder(o);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-[11px] font-semibold text-indigo-300 hover:text-white transition cursor-pointer"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Footer Controls */}
        <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          {/* Record info & Limit selector */}
          <div className="flex items-center space-x-3">
            <span>
              Showing <strong className="text-white">{startRecord}</strong> to{' '}
              <strong className="text-white">{endRecord}</strong> of{' '}
              <strong className="text-white">{totalRecords.toLocaleString()}</strong> orders
            </span>
            <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-800">
              <span className="text-[11px] text-slate-500">Rows:</span>
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 text-xs font-mono focus:outline-hidden cursor-pointer"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-1.5">
            {/* First */}
            <button
              onClick={() => onPageChange(1)}
              disabled={page <= 1 || loading}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev */}
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Current Page Indicator */}
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded font-semibold text-white">
              Page {page} of {Math.max(1, totalPages)}
            </span>

            {/* Next */}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last */}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages || loading}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
