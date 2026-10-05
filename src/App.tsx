import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { OrderHistoryTable } from './components/OrderHistoryTable';
import {
  PARENT_STATUSES,
  type ProtectiveBookRow,
  type ParentOrderRow,
} from './types/oms';
import { omsApi } from './api/omsApi';
import { useOrderHistory, useOrderActions } from './hooks';
import { AlertCircle, CheckCircle2, X, ShieldCheck } from 'lucide-react';

const CancellableLegsModal = lazy(() =>
  import('./components/ActionModals').then((m) => ({ default: m.CancellableLegsModal }))
);

export const App: React.FC = () => {
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(() => {
    const saved = Number(localStorage.getItem('oms_auto_refresh'));
    return saved === 10000 || saved === 30000 || saved === 60000 ? saved : 10000;
  });

  const handleAutoRefreshChange = (intervalMs: number) => {
    setAutoRefreshInterval(intervalMs);
    localStorage.setItem('oms_auto_refresh', intervalMs.toString());
  };

  // 1. Hook for Firm-wide Paginated Order History
  const history = useOrderHistory({
    initialPage: 1,
    initialLimit: 25,
    initialStatus: 'ALL',
    autoRefreshInterval,
  });

  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [legsRefreshToken, setLegsRefreshToken] = useState(0);

  // 3. Hook for Trade Actions & Audit Logging
  const { cancelLeg } = useOrderActions();

  // Modals & UI States
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [healthChecked, setHealthChecked] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [cancelListParent, setCancelListParent] = useState<ParentOrderRow | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const checkServerHealth = useCallback(async () => {
    const res = await omsApi.checkHealth();
    setIsBackendHealthy(res.healthy);
    setHealthChecked(true);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const startId = window.setTimeout(() => {
      void checkServerHealth();
      interval = setInterval(checkServerHealth, 20000);
    }, 1500);
    return () => {
      clearTimeout(startId);
      if (interval) clearInterval(interval);
    };
  }, [checkServerHealth]);

  const handleSelectHistoryOrder = (order: ParentOrderRow) => {
    const nextId = String(order.omsOrderID);
    setExpandedOrderIds((current) =>
      current.includes(nextId) ? current.filter((id) => id !== nextId) : [...current, nextId]
    );
  };

  const handleCancelSelected = async (legs: ProtectiveBookRow[], reason: string) => {
    for (const order of legs) {
      await cancelLeg({
        appOrderID: `OMSLEG-${order.omsLegID}`,
        clientID: order.clientID || order.userID,
        userID: order.userID,
        reason,
      });
      await omsApi.logAuditEvent({
        omsOrderID: order.omsOrderID,
        omsLegID: order.omsLegID,
        eventType: 'OPERATOR_CANCEL_LEG',
        reason,
        actor: 'BACKOFFICE_OPERATOR',
        metadata: { appOrderID: `OMSLEG-${order.omsLegID}`, userID: order.userID },
      });
    }
    showToast(
      legs.length === 1
        ? `Protective leg OMSLEG-${legs[0].omsLegID} cancelled.`
        : `${legs.length} protective legs cancelled.`,
      'success'
    );
    setLegsRefreshToken((token) => token + 1);
    void history.refetch();
  };

  const openParentCount = useMemo(() => {
    const closed = new Set(['EXITED', 'CANCELLED', 'FAILED']);
    return PARENT_STATUSES.reduce((sum, status) => {
      if (closed.has(status)) return sum;
      return sum + Number(history.stats.counts?.[status] || 0);
    }, 0);
  }, [history.stats.counts]);

  return (
    <div className="h-dvh overflow-hidden bg-[#F4F6F8] text-[#1A1D23] flex flex-col font-sans">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center px-4 py-3 rounded-xl border shadow-sm max-w-md ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-[#1A1D23]'
              : toast.type === 'error'
              ? 'bg-white border-rose-200 text-[#1A1D23]'
              : 'bg-white border-[#D8DCE3] text-[#1A1D23]'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 mr-3 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <ShieldCheck className="w-5 h-5 mr-3 text-indigo-400 shrink-0" />}
          <span className="text-xs font-medium mr-2">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-[#5C6570] hover:text-[#1A1D23] cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Navbar
        onRefresh={() => {
          void history.refetch();
          setLegsRefreshToken((token) => token + 1);
        }}
        loading={history.isLoading}
        activeCount={openParentCount}
        isBackendHealthy={isBackendHealthy}
        currentView="HISTORY"
        autoRefreshInterval={autoRefreshInterval}
        onAutoRefreshChange={handleAutoRefreshChange}
      />

      <main className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 overflow-hidden">
        {healthChecked && !isBackendHealthy && (
          <div className="shrink-0 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold">OMS Backend Unreachable:</span> Cannot reach OMS worker
              backend service. Please ensure the service is running.
            </div>
          </div>
        )}

        <OrderHistoryTable
          orders={history.orders}
          pagination={history.pagination}
          stats={history.stats}
          loading={history.isLoading}
          onPageChange={history.setPage}
          onLimitChange={history.setLimit}
          onStatusChange={history.setStatus}
          onSearchChange={history.setSearch}
          onSelectOrder={handleSelectHistoryOrder}
          onRefresh={history.refetch}
          error={history.error}
          activeStatus={history.status}
          initialSearch={history.search}
          expandedOrderIds={expandedOrderIds}
          legsRefreshToken={legsRefreshToken}
          onOpenCancel={setCancelListParent}
        />
      </main>

      <Suspense fallback={null}>
        {cancelListParent && (
          <CancellableLegsModal
            parent={cancelListParent}
            refreshToken={legsRefreshToken}
            onClose={() => setCancelListParent(null)}
            onCancelSelected={handleCancelSelected}
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;
