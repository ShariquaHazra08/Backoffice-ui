import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { UserLookupBar } from './components/UserLookupBar';
import { ProtectiveLegCard } from './components/ProtectiveLegCard';
import { ActionModal } from './components/ActionModals';
import { SettingsModal } from './components/SettingsModal';
import { OrderHistoryTable } from './components/OrderHistoryTable';
import type {
  ProtectiveBookRow,
  OrderHistoryRow,
  OrderHistoryStats,
  OrderHistoryPaginationMeta,
} from './types/oms';
import { omsApi } from './api/omsApi';
import {
  Inbox,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation: 'HISTORY' (Page 1 Master Feed) vs 'ORDERS' (Page 2 User Intervention)
  const [currentView, setCurrentView] = useState<'HISTORY' | 'ORDERS'>('HISTORY');

  // Master Paginated Order History State (Page 1)
  const [historyOrders, setHistoryOrders] = useState<OrderHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState<OrderHistoryPaginationMeta>({
    page: 1,
    limit: 25,
    totalRecords: 0,
    totalPages: 1,
  });
  const [historyStats, setHistoryStats] = useState<OrderHistoryStats>({
    total: 0,
    armed: 0,
    filled: 0,
    cancelled: 0,
    pending: 0,
    exited: 0,
    active_traders: 0,
  });
  const [historyStatus, setHistoryStatus] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  // Selected User & Orders state (Page 2)
  const [userId, setUserId] = useState<string>(() => localStorage.getItem('last_user_id') || 'MAA095');
  const [appOrderId, setAppOrderId] = useState<string>('');
  const [orders, setOrders] = useState<ProtectiveBookRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Modals & Health
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Action Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'CANCEL_LEG' | 'FORCE_EXIT' | 'CANCEL_ENTRY' | null;
    order: ProtectiveBookRow | null;
  }>({
    isOpen: false,
    type: null,
    order: null,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Poll backend health
  const checkServerHealth = useCallback(async () => {
    const res = await omsApi.checkHealth();
    setIsBackendHealthy(res.healthy);
  }, []);

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, [checkServerHealth]);

  // Fetch Paginated Master Order History (Page 1)
  const fetchOrderHistory = useCallback(
    async (
      page: number = historyPagination.page,
      limit: number = historyPagination.limit,
      status: string = historyStatus,
      search: string = historySearch
    ) => {
      setHistoryLoading(true);
      try {
        const res = await omsApi.getOrderHistory({ page, limit, status, search });
        setHistoryOrders(res.data);
        setHistoryPagination(res.pagination);
        setHistoryStats(res.stats);
      } catch (err: any) {
        console.error('Failed to fetch order history:', err);
        showToast(err?.message || 'Could not load order history from OMS database', 'error');
      } finally {
        setHistoryLoading(false);
      }
    },
    [historyPagination.page, historyPagination.limit, historyStatus, historySearch]
  );

  // Initial fetch of order history on mount
  useEffect(() => {
    fetchOrderHistory(1, 25, 'ALL', '');
  }, []);

  const handleHistoryPageChange = (newPage: number) => {
    fetchOrderHistory(newPage, historyPagination.limit, historyStatus, historySearch);
  };

  const handleHistoryLimitChange = (newLimit: number) => {
    fetchOrderHistory(1, newLimit, historyStatus, historySearch);
  };

  const handleHistoryStatusChange = (newStatus: string) => {
    setHistoryStatus(newStatus);
    fetchOrderHistory(1, historyPagination.limit, newStatus, historySearch);
  };

  const handleHistorySearchChange = (newSearch: string) => {
    setHistorySearch(newSearch);
    fetchOrderHistory(1, historyPagination.limit, historyStatus, newSearch);
  };

  // Handler when admin clicks an order row from Master History
  const handleSelectHistoryOrder = (order: OrderHistoryRow) => {
    setUserId(order.userID);
    setActiveFilter('ALL');
    setAppOrderId('');
    setCurrentView('ORDERS');
    fetchOrders(order.userID);
  };

  // Fetch Orders for Selected User (Page 2)
  const fetchOrders = async (targetUser: string, targetOrder?: string) => {
    if (!targetUser.trim()) return;
    setOrdersLoading(true);
    try {
      localStorage.setItem('last_user_id', targetUser.trim());
      setUserId(targetUser.trim());
      const list = await omsApi.getProtectives(targetUser, targetOrder);
      setOrders(list);

      if (list.length === 0) {
        showToast(`No active protective orders found for user ${targetUser}`, 'info');
      } else {
        showToast(`Loaded ${list.length} live order leg(s) for user ${targetUser}`, 'success');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      const msg = err?.message || 'Failed to fetch orders from OMS backend';
      showToast(msg, 'error');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Handle interventions
  const handleActionConfirm = async (_reason: string) => {
    const { type, order } = actionModal;
    if (!type || !order) return;

    try {
      if (type === 'CANCEL_LEG') {
        const syntheticId = `OMSLEG-${order.omsLegID}`;
        await omsApi.cancelProtectiveLeg({
          appOrderID: syntheticId,
          clientID: order.clientID || order.userID,
          userID: order.userID,
        });
        showToast(`Protective leg OMSLEG-${order.omsLegID} cancelled successfully on OMS!`, 'success');
      } else if (type === 'FORCE_EXIT') {
        await omsApi.exitSmartIntraday({
          appOrderID: order.omsOrderID.toString(),
          clientID: order.clientID || order.userID,
          userID: order.userID,
        });
        showToast(`Position for OMS order ${order.omsOrderID} exited on Symphony!`, 'success');
      } else if (type === 'CANCEL_ENTRY') {
        if (!order.entryAppOrderID) {
          throw new Error('No Symphony AppOrderID present for this entry order.');
        }
        await omsApi.cancelEntryOrder({
          appOrderID: order.entryAppOrderID.toString(),
          clientID: order.clientID || order.userID,
          userID: order.userID,
        });
        showToast(`Entry order ${order.entryAppOrderID} cancelled on Symphony!`, 'success');
      }

      // Refresh both orders and master history stats
      await fetchOrders(order.userID, appOrderId);
      fetchOrderHistory();
    } catch (err: any) {
      console.error('Action error:', err);
      const msg = err?.message || 'Action failed on Symphony/OMS';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Compute live status counts for the selected user
  const statusCounts: Record<string, number> = {
    ALL: orders.length,
    ARMED: orders.filter((o) => o.status.toUpperCase() === 'ARMED').length,
    FILLED: orders.filter((o) => o.status.toUpperCase() === 'FILLED').length,
    PLACED: orders.filter((o) => o.status.toUpperCase() === 'PLACED').length,
    EXITED: orders.filter((o) => o.status.toUpperCase() === 'EXITED' || o.status.toUpperCase() === 'FIRED').length,
    PENDING: orders.filter((o) => o.status.toUpperCase() === 'PENDING').length,
    CANCELLED: orders.filter((o) => o.status.toUpperCase() === 'CANCELLED').length,
  };

  // Filter orders by active status
  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'ALL') return true;
    const st = String(order.status || '').toUpperCase();
    if (activeFilter.toUpperCase() === 'EXITED') {
      return st === 'EXITED' || st === 'FIRED';
    }
    return st === activeFilter.toUpperCase();
  });

  // Group orders by Parent OMS Order ID
  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const key = String(order.omsOrderID || 'UNKNOWN');
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(order);
    return acc;
  }, {} as Record<string, ProtectiveBookRow[]>);

  const activeCount = orders.filter(
    (o) => {
      const s = String(o.status || '').toUpperCase();
      return s === 'ARMED' || s === 'PLACED';
    }
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center px-4 py-3 rounded-xl border shadow-2xl transition-all animate-in slide-in-from-top-3 max-w-md ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950 border-rose-700 text-rose-200'
              : 'bg-slate-900 border-slate-700 text-slate-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 mr-3 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <ShieldCheck className="w-5 h-5 mr-3 text-indigo-400 shrink-0" />}
          <span className="text-xs font-medium mr-2">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={() => {
          if (currentView === 'HISTORY') {
            fetchOrderHistory();
          } else {
            fetchOrders(userId, appOrderId);
          }
        }}
        loading={currentView === 'HISTORY' ? historyLoading : ordersLoading}
        activeCount={currentView === 'HISTORY' ? historyStats.armed : activeCount}
        isBackendHealthy={isBackendHealthy}
        currentView={currentView}
        onNavigateDirectory={() => {
          setCurrentView('HISTORY');
          fetchOrderHistory();
        }}
        selectedUserId={userId}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Backend offline warning banner */}
        {!isBackendHealthy && (
          <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 flex items-center gap-3 text-rose-200 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold">OMS Backend Unreachable:</span> Cannot reach oms-worker at port 8089. Please ensure the service is running.
            </div>
          </div>
        )}

        {/* PAGE 1: MASTER PAGINATED ORDER HISTORY */}
        {currentView === 'HISTORY' && (
          <OrderHistoryTable
            orders={historyOrders}
            pagination={historyPagination}
            stats={historyStats}
            loading={historyLoading}
            onPageChange={handleHistoryPageChange}
            onLimitChange={handleHistoryLimitChange}
            onStatusChange={handleHistoryStatusChange}
            onSearchChange={handleHistorySearchChange}
            onSelectOrder={handleSelectHistoryOrder}
            onRefresh={() => fetchOrderHistory()}
            activeStatus={historyStatus}
            initialSearch={historySearch}
          />
        )}

        {/* PAGE 2: SELECTED USER ORDERS & INTERVENTION */}
        {currentView === 'ORDERS' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* User & Order Lookup Bar with status badges and Back button */}
            <UserLookupBar
              initialUserId={userId}
              onSearch={(targetUser, targetOrder) => {
                setAppOrderId(targetOrder || '');
                fetchOrders(targetUser, targetOrder);
              }}
              loading={ordersLoading}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              statusCounts={statusCounts}
              onBackToDirectory={() => {
                setCurrentView('HISTORY');
                fetchOrderHistory();
              }}
            />

            {/* Orders List / Tree View */}
            {Object.keys(groupedOrders).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedOrders).map(([parentOmsId, legs]) => {
                  const primaryLeg = legs[0];
                  const isIntraday = primaryLeg?.productType === 'MIS';

                  return (
                    <div
                      key={parentOmsId}
                      className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
                    >
                      {/* Parent Order Header Bar */}
                      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-white tracking-wider">
                                OMS PARENT #{parentOmsId}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                  isIntraday
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                    : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                                }`}
                              >
                                {primaryLeg?.productType || 'MIS'}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {primaryLeg?.exchangeSegment} : {primaryLeg?.exchangeInstrumentID}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Trader User ID:{' '}
                              <span className="text-indigo-300 font-mono font-semibold">{primaryLeg?.userID}</span>
                              {primaryLeg?.clientID && primaryLeg.clientID !== primaryLeg.userID && (
                                <span className="ml-2 text-slate-500">
                                  (Client: <span className="text-slate-300">{primaryLeg.clientID}</span>)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Parent Level Summary & Force Exit */}
                        <div className="flex items-center space-x-3">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-400 uppercase font-mono">Child Legs</p>
                            <p className="text-xs font-bold text-white font-mono">{legs.length} Leg(s)</p>
                          </div>
                          <button
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                type: 'FORCE_EXIT',
                                order: primaryLeg,
                              })
                            }
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/90 hover:bg-rose-600 text-white transition shadow-sm cursor-pointer"
                            title="Square-off filled position on Symphony and cancel open legs"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Force Square-Off</span>
                          </button>
                        </div>
                      </div>

                      {/* Child Legs Grid */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {legs.map((order) => (
                          <ProtectiveLegCard
                            key={order.omsLegID}
                            order={order}
                            onCancelLeg={(order) =>
                              setActionModal({
                                isOpen: true,
                                type: 'CANCEL_LEG',
                                order,
                              })
                            }
                            onForceExit={(order) =>
                              setActionModal({
                                isOpen: true,
                                type: 'FORCE_EXIT',
                                order,
                              })
                            }
                            onCancelEntry={(order) =>
                              setActionModal({
                                isOpen: true,
                                type: 'CANCEL_ENTRY',
                                order,
                              })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State for Selected User */
              <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  No Orders Found for {userId}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                  No orders with status "{activeFilter}" exist for trader "{userId}".
                </p>
                <button
                  onClick={() => {
                    setCurrentView('HISTORY');
                    fetchOrderHistory();
                  }}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg shadow-sm transition"
                >
                  ← Back to Master Order History
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => {
          showToast('API Connection Settings Updated!', 'info');
          if (currentView === 'HISTORY') {
            fetchOrderHistory();
          } else {
            fetchOrders(userId, appOrderId);
          }
          checkServerHealth();
        }}
      />

      {/* Action Confirmation Modal */}
      <ActionModal
        isOpen={actionModal.isOpen}
        type={actionModal.type}
        order={actionModal.order}
        onClose={() => setActionModal({ isOpen: false, type: null, order: null })}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
};

export default App;
