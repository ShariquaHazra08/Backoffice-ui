import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { omsApi } from '../api/omsApi';
import type {
  OrderHistoryRow,
  ParentOrderStats,
  OrderHistoryPaginationMeta,
} from '../types/oms';

export interface UseOrderHistoryOptions {
  initialPage?: number;
  initialLimit?: number;
  initialStatus?: string;
  initialSearch?: string;
  autoRefreshInterval?: number; // ms, <= 0 to disable
}

export function useOrderHistory(options: UseOrderHistoryOptions = {}) {
  const {
    initialPage = 1,
    initialLimit = 25,
    initialStatus = 'ALL',
    initialSearch = '',
    autoRefreshInterval = 5000,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);

  const [orders, setOrders] = useState<OrderHistoryRow[]>([]);
  const [pagination, setPagination] = useState<OrderHistoryPaginationMeta>({
    page: initialPage,
    limit: initialLimit,
    totalRecords: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState<ParentOrderStats>({
    total: 0,
    counts: {},
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep latest params in ref for background polling
  const paramsRef = useRef({ page, limit, status, search });
  useEffect(() => {
    paramsRef.current = { page, limit, status, search };
  }, [page, limit, status, search]);

  const fetchOrders = useCallback(
    async (
      overrideParams?: Partial<{
        page: number;
        limit: number;
        status: string;
        search: string;
      }>,
      isBackground = false
    ) => {
      const p = { ...paramsRef.current, ...overrideParams };
      const currentRequestId = ++requestIdRef.current;

      // Abort previous in-flight request to prevent race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (!isBackground) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const response = await omsApi.getParentOrders({
          page: p.page,
          limit: p.limit,
          status: p.status,
          search: p.search,
        });

        // If a newer request was dispatched while waiting, ignore this response
        if (currentRequestId !== requestIdRef.current) return;

        startTransition(() => {
          setOrders(response.data);
          setPagination(response.pagination);
          setStats(response.stats);
        });
      } catch (err: any) {
        if (currentRequestId === requestIdRef.current) {
          setError(err?.message || 'Failed to load order history');
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    []
  );

  // Fetch when filters or page change
  useEffect(() => {
    void fetchOrders({ page, limit, status, search }, false);
  }, [page, limit, status, search, fetchOrders]);

  // Background auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      void fetchOrders(undefined, true);
    }, autoRefreshInterval);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchOrders]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetStatus = useCallback((newStatus: string) => {
    setStatus(newStatus);
    setPage(1); // Reset to page 1 on filter change
  }, []);

  const handleSetSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to page 1 on search change
  }, []);

  const refetch = useCallback(async () => {
    await fetchOrders(undefined, false);
  }, [fetchOrders]);

  return {
    orders,
    pagination,
    stats,
    isLoading,
    isRefreshing,
    error,
    page,
    limit,
    status,
    search,
    setPage: handleSetPage,
    setLimit,
    setStatus: handleSetStatus,
    setSearch: handleSetSearch,
    refetch,
  };
}
