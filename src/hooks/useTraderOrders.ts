import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { omsApi } from '../api/omsApi';
import type { ProtectiveBookRow } from '../types/oms';

export function useTraderOrders(omsOrderId: string) {
  const [orders, setOrders] = useState<ProtectiveBookRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const requestIdRef = useRef(0);
  const orderRef = useRef(omsOrderId);
  const loadRef = useRef<{ id: string; promise: Promise<void> } | null>(null);
  useEffect(() => {
    orderRef.current = omsOrderId;
  }, [omsOrderId]);

  const fetchTraderOrders = useCallback(
    async () => {
      const targetOrder = String(orderRef.current || '').trim();
      if (!targetOrder) {
        setOrders([]);
        return;
      }

      const currentId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const data = await omsApi.getChildLegs(targetOrder);
        if (currentId !== requestIdRef.current) return;

        startTransition(() => {
          setOrders(data);
        });
      } catch (err: any) {
        if (currentId === requestIdRef.current) {
          setError(err?.message || 'Failed to fetch trader orders');
        }
      } finally {
        if (currentId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (loadRef.current?.id === omsOrderId) return;
    const promise = fetchTraderOrders().finally(() => {
      if (loadRef.current?.promise === promise) loadRef.current = null;
    });
    loadRef.current = { id: omsOrderId, promise };
  }, [omsOrderId, fetchTraderOrders]);

  const refetch = useCallback(async () => {
    await fetchTraderOrders();
  }, [fetchTraderOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch,
  };
}
