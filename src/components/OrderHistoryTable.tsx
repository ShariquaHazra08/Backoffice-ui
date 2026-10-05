import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  X,
  ShieldCheck,
  Columns3,
} from 'lucide-react';
import { PARENT_STATUSES, legCanBeCancelled, type OrderHistoryRow, type ParentOrderStats, type OrderHistoryPaginationMeta } from '../types/oms';
import { omsApi } from '../api/omsApi';
import { TraderOrdersView } from './TraderOrdersView';
import { useTraderOrders } from '../hooks/useTraderOrders';

const PARENT_TABLE_COLUMNS = [
  { id: 'omsOrderID', label: 'OMS order id' },
  { id: 'userID', label: 'User id' },
  { id: 'product', label: 'Product' },
  { id: 'segment', label: 'Segment' },
  { id: 'instrument', label: 'Instrument id' },
  { id: 'displayName', label: 'Display name' },
  { id: 'parentStatus', label: 'Parent status' },
  { id: 'entryValidity', label: 'Entry validity' },
  { id: 'validUntil', label: 'Valid until' },
  { id: 'createdAt', label: 'Created' },
  { id: 'updatedAt', label: 'Updated' },
  { id: 'manage', label: 'Action' },
] as const;

type ParentColumnId = (typeof PARENT_TABLE_COLUMNS)[number]['id'];

const ALL_COLUMN_IDS: ParentColumnId[] = PARENT_TABLE_COLUMNS.map((column) => column.id);
const COLUMN_STORAGE_KEY = 'oms_parent_visible_columns_v2';

const ExpandedParentLegs: React.FC<{
  omsOrderId: string;
  refreshToken: number;
  onCollapse: () => void;
}> = ({ omsOrderId, refreshToken, onCollapse }) => {
  const trader = useTraderOrders(omsOrderId);
  const seenToken = useRef(refreshToken);

  useEffect(() => {
    if (seenToken.current === refreshToken) return;
    seenToken.current = refreshToken;
    void trader.refetch();
  }, [refreshToken, trader.refetch]);

  return (
    <TraderOrdersView
      legs={trader.orders}
      ordersLoading={trader.isLoading}
      error={trader.error}
      onCollapse={onCollapse}
    />
  );
};

const loadVisibleColumns = (): ParentColumnId[] => {
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return [...ALL_COLUMN_IDS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...ALL_COLUMN_IDS];
    const known = new Set<string>(ALL_COLUMN_IDS);
    return parsed.filter((id): id is ParentColumnId => known.has(id));
  } catch {
    return [...ALL_COLUMN_IDS];
  }
};

interface OrderHistoryTableProps {
  orders: OrderHistoryRow[];
  pagination: OrderHistoryPaginationMeta;
  stats: ParentOrderStats;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onSelectOrder: (order: OrderHistoryRow) => void;
  onRefresh: () => void;
  error?: string | null;
  activeStatus: string;
  initialSearch?: string;
  expandedOrderIds?: string[];
  legsRefreshToken?: number;
  onOpenCancel?: (order: OrderHistoryRow) => void;
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
  error,
  activeStatus,
  initialSearch = '',
  expandedOrderIds = [],
  legsRefreshToken = 0,
  onOpenCancel,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<ParentColumnId[]>(loadVisibleColumns);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const visible = new Set(visibleColumns);
  const showColumn = (id: ParentColumnId) => visible.has(id);
  const columnCount = Math.max(visibleColumns.length, 1);
  const canOpenParent = visibleColumns.length > 0;
  const openIds = new Set(expandedOrderIds);
  const [cancellableIds, setCancellableIds] = useState<Set<string>>(new Set());
  const pageOrderIds = orders.map((order) => String(order.omsOrderID)).join(',');

  useEffect(() => {
    const ids = pageOrderIds ? pageOrderIds.split(',') : [];
    if (ids.length === 0) {
      setCancellableIds(new Set());
      return;
    }
    let cancelled = false;
    void Promise.all(
      ids.map(async (id) => {
        try {
          const legs = await omsApi.getChildLegs(id);
          return legs.some(legCanBeCancelled) ? id : '';
        } catch {
          return '';
        }
      })
    ).then((found) => {
      if (!cancelled) setCancellableIds(new Set(found.filter(Boolean)));
    });
    return () => {
      cancelled = true;
    };
  }, [pageOrderIds, legsRefreshToken]);

  // Sync internal search with prop if external changes happen
  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    if (!columnsOpen) return;
    const close = (event: MouseEvent) => {
      if (!columnsRef.current?.contains(event.target as Node)) setColumnsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [columnsOpen]);

  const toggleColumn = (id: ParentColumnId) => {
    setVisibleColumns((current) => {
      if (current.includes(id)) {
        return current.filter((columnId) => columnId !== id);
      }
      const next = new Set([...current, id]);
      return ALL_COLUMN_IDS.filter((columnId) => next.has(columnId));
    });
  };

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

  const formatWhen = (d?: string) => {
    if (!d) return '—';
    const { time, date } = formatTimestamp(d);
    return date ? `${date} ${time}` : time;
  };

  const chipCount = (label: string) => {
    if (label === 'ALL') return stats.total;
    return stats.counts?.[label] ?? 0;
  };

  const { page, limit, totalRecords, totalPages } = pagination;
  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  const statusChips = ['ALL', ...PARENT_STATUSES].map((label) => ({
    label,
    count: chipCount(label),
  }));

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      {/* 1. Global Metrics Snapshot */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E6E8EC] rounded-lg px-4 py-3">
          <p className="text-[11px] text-[#6B7280] uppercase tracking-wider">Total parents</p>
          <p className="text-xl font-semibold text-[#1A1D23] font-mono mt-0.5">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#E6E8EC] rounded-lg px-4 py-3">
          <p className="text-[11px] text-[#6B7280] uppercase tracking-wider">Armed</p>
          <p className="text-xl font-semibold text-[#1A1D23] font-mono mt-0.5">{cancellableIds.size}</p>
        </div>
        <div className="bg-white border border-[#E6E8EC] rounded-lg px-4 py-3">
          <p className="text-[11px] text-[#6B7280] uppercase tracking-wider">Filled</p>
          <p className="text-xl font-semibold text-[#1A1D23] font-mono mt-0.5">{chipCount('ENTRY_FILLED')}</p>
        </div>
        <div className="bg-white border border-[#E6E8EC] rounded-lg px-4 py-3">
          <p className="text-[11px] text-[#6B7280] uppercase tracking-wider">Failed</p>
          <p className="text-xl font-semibold text-[#1A1D23] font-mono mt-0.5">{chipCount('FAILED')}</p>
        </div>
        <div className="bg-white border border-[#E6E8EC] rounded-lg px-4 py-3">
          <p className="text-[11px] text-[#6B7280] uppercase tracking-wider">Exited</p>
          <p className="text-xl font-semibold text-[#1A1D23] font-mono mt-0.5">{chipCount('EXITED')}</p>
        </div>
        <div className="bg-white border border-[#E6E8EC] rounded-lg px-4 py-3">
          <p className="text-[11px] text-[#6B7280] uppercase tracking-wider">Cancelled</p>
          <p className="text-xl font-semibold text-[#1A1D23] font-mono mt-0.5">{chipCount('CANCELLED')}</p>
        </div>
      </div>

      {/* 2. Filter Bar (Search + Status dropdown + Refresh) */}
      <div className="shrink-0 bg-white border border-[#E6E8EC] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search user id, parent id, instrument"
            className="w-full rounded-lg border border-[#D8DCE3] bg-white py-2 pl-10 pr-10 text-xs font-mono text-[#1A1D23] placeholder-[#9AA3B2] transition focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#5C6570] hover:text-[#1A1D23]"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <label className="flex flex-col gap-1 min-w-[220px]">
          <span className="text-[11px] uppercase tracking-wider text-[#6B7280]">Status</span>
          <select
            value={activeStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-[#D8DCE3] bg-white py-2 px-3 text-xs font-mono text-[#1A1D23] cursor-pointer focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            aria-label="Filter by parent status"
          >
            {statusChips.map((chip) => (
              <option key={chip.label} value={chip.label}>
                {chip.label.replaceAll('_', ' ')} ({chip.count})
              </option>
            ))}
          </select>
        </label>

        <div className="relative self-end" ref={columnsRef}>
          <button
            type="button"
            onClick={() => setColumnsOpen((open) => !open)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#EEF1F4] text-xs font-medium text-[#1A1D23] transition cursor-pointer border border-[#D8DCE3]"
            aria-expanded={columnsOpen}
            aria-haspopup="dialog"
            title="Choose which columns to show"
          >
            <Columns3 className="w-3.5 h-3.5 text-indigo-700" />
            <span>Columns</span>
          </button>
          {columnsOpen && (
            <div className="absolute right-0 z-30 mt-1 w-56 rounded-lg border border-[#E6E8EC] bg-white p-2 shadow-lg">
              <div className="mb-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => setVisibleColumns([...ALL_COLUMN_IDS])}
                  className="flex-1 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleColumns([])}
                  className="flex-1 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-[#3A4250] hover:bg-[#F4F6F8] cursor-pointer"
                >
                  Unselect all
                </button>
              </div>
              {PARENT_TABLE_COLUMNS.map((column) => {
                const checked = showColumn(column.id);
                return (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#1A1D23] hover:bg-[#F4F6F8] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColumn(column.id)}
                      className="accent-indigo-600"
                    />
                    <span>{column.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#EEF1F4] hover:bg-[#E6E8EC] text-xs font-medium text-[#1A1D23] transition cursor-pointer border border-[#D8DCE3] self-end"
          title="Refresh order history"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* 3. Paginated Order History Table — only this region scrolls */}
      <div className="flex-1 min-h-0 bg-white border border-[#E6E8EC] rounded-xl overflow-hidden shadow-sm relative flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-max min-w-full border-separate border-spacing-0 text-left text-xs text-[#3A4250] font-sans">
            <thead className="bg-white text-[11px] uppercase tracking-wider text-[#5C6570] font-mono sticky top-0 z-10 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-[#E6E8EC] [&_th]:bg-white [&_th]:align-middle">
              <tr>
                {showColumn('omsOrderID') && <th className="py-3 px-4">OMS order id</th>}
                {showColumn('userID') && <th className="py-3 px-4">User id</th>}
                {showColumn('product') && <th className="py-3 px-4">Product</th>}
                {showColumn('segment') && <th className="py-3 px-4">Segment</th>}
                {showColumn('instrument') && <th className="py-3 px-4">Instrument id</th>}
                {showColumn('displayName') && <th className="py-3 px-4">Display name</th>}
                {showColumn('parentStatus') && <th className="py-3 px-4">Parent status</th>}
                {showColumn('entryValidity') && <th className="py-3 px-4">Entry validity</th>}
                {showColumn('validUntil') && <th className="py-3 px-4">Valid until</th>}
                {showColumn('createdAt') && <th className="py-3 px-4">Created</th>}
                {showColumn('updatedAt') && <th className="py-3 px-4">Updated</th>}
                {showColumn('manage') && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="[&_td]:border-b [&_td]:border-[#EEF1F4] [&_td]:align-middle">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="py-16 text-center text-[#5C6570] font-mono">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-indigo-400 animate-spin" />
                    Loading orders stream from OMS database...
                  </td>
                </tr>
              ) : !canOpenParent ? (
                <tr>
                  <td colSpan={columnCount} className="py-16 text-center">
                    <p className="text-sm font-semibold text-[#1A1D23]">No columns selected</p>
                    <p className="text-xs text-[#5C6570] mt-1">Use Columns and choose Select all, or tick the columns you want.</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="py-16 text-center">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-[#1A1D23]">No Orders Found</p>
                    <p className="text-xs text-[#5C6570] mt-1 max-w-md mx-auto">
                      {error
                        ? error
                        : searchTerm
                        ? `No parents matching "${searchTerm}" with status "${activeStatus}".`
                        : `No parents found with status "${activeStatus}".`}
                    </p>
                    {(searchTerm || activeStatus !== 'ALL') && (
                      <button
                        onClick={() => {
                          handleClearSearch();
                          onStatusChange('ALL');
                        }}
                        className="mt-3 px-3 py-1.5 text-xs bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const orderId = String(o.omsOrderID);
                  const expanded = openIds.has(orderId);
                  return (
                    <React.Fragment key={orderId}>
                    <tr
                      onClick={canOpenParent ? () => onSelectOrder(o) : undefined}
                      className={`cv-row group border-l-2 border-l-transparent transition ${
                        expanded ? 'bg-[#F4F6F8]' : ''
                      } ${canOpenParent ? 'hover:bg-[#F4F6F8] cursor-pointer' : ''}`}
                    >
                      {showColumn('omsOrderID') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[#1A1D23] font-semibold">{orderId}</span>
                            <button
                              onClick={(e) => handleCopy(e, orderId)}
                              className="text-[#6B7280] hover:text-[#3A4250] transition"
                              title="Copy OMS order id"
                            >
                              {copiedId === orderId ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                      {showColumn('userID') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-[#1A1D23]">{o.userID}</td>
                      )}
                      {showColumn('product') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{o.productType || '—'}</td>
                      )}
                      {showColumn('segment') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{o.exchangeSegment || '—'}</td>
                      )}
                      {showColumn('instrument') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{o.exchangeInstrumentID || '—'}</td>
                      )}
                      {showColumn('displayName') && (
                        <td className="py-3 px-4 whitespace-nowrap text-[12px] font-semibold text-[#1A1D23]">
                          {o.displayName || '—'}
                        </td>
                      )}
                      {showColumn('parentStatus') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{o.parentStatus || '—'}</td>
                      )}
                      {showColumn('entryValidity') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{o.entryValidity || '—'}</td>
                      )}
                      {showColumn('validUntil') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{formatWhen(o.validityUntil)}</td>
                      )}
                      {showColumn('createdAt') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{formatWhen(o.createdAt)}</td>
                      )}
                      {showColumn('updatedAt') && (
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{formatWhen(o.updatedAt)}</td>
                      )}
                      {showColumn('manage') && (
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCancel?.(o);
                            }}
                            className={`inline-flex items-center px-2.5 py-1 rounded-md bg-white text-[11px] font-semibold transition cursor-pointer border ${
                              cancellableIds.has(orderId)
                                ? 'hover:bg-rose-50 border-rose-300 text-rose-700'
                                : 'hover:bg-indigo-50 border-indigo-200 text-indigo-700'
                            }`}
                          >
                            Cancel
                          </button>
                        </td>
                      )}
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={columnCount} className="p-0 border-b border-[#E6E8EC]">
                          <div className="max-w-0 min-w-full overflow-x-auto">
                            <ExpandedParentLegs
                              omsOrderId={orderId}
                              refreshToken={legsRefreshToken}
                              onCollapse={() => onSelectOrder(o)}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Footer Controls */}
        <div className="shrink-0 bg-white backdrop-blur-md border-t border-[#E6E8EC] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C6570] font-mono z-20 shadow-sm">
          {/* Record info & Limit selector */}
          <div className="flex items-center space-x-3">
            <span>
              Showing <strong className="text-[#1A1D23]">{startRecord}</strong> to{' '}
              <strong className="text-[#1A1D23]">{endRecord}</strong> of{' '}
              <strong className="text-[#1A1D23]">{totalRecords.toLocaleString()}</strong> parents
            </span>
            <div className="flex items-center space-x-1.5 pl-3 border-l border-[#E6E8EC]">
              <label htmlFor="history-rows-per-page" className="text-[11px] text-[#5C6570]">
                Rows:
              </label>
              <select
                id="history-rows-per-page"
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="bg-white border border-[#D8DCE3] text-[#1A1D23] rounded px-2 py-0.5 text-xs font-mono focus:outline-hidden cursor-pointer"
                aria-label="Rows per page"
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
              className="p-1 rounded bg-white hover:bg-[#EEF1F4] border border-[#E6E8EC] text-[#3A4250] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev */}
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1 rounded bg-white hover:bg-[#EEF1F4] border border-[#E6E8EC] text-[#3A4250] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Current Page Indicator */}
            <span className="px-3 py-1 bg-white border border-[#E6E8EC] rounded font-semibold text-[#1A1D23]">
              Page {page} of {Math.max(1, totalPages)}
            </span>

            {/* Next */}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1 rounded bg-white hover:bg-[#EEF1F4] border border-[#E6E8EC] text-[#3A4250] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last */}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages || loading}
              className="p-1 rounded bg-white hover:bg-[#EEF1F4] border border-[#E6E8EC] text-[#3A4250] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
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
