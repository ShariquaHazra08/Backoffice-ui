import { useState, useCallback } from 'react';
import { omsApi } from '../api/omsApi';
import type { CancelOrderPayload } from '../types/oms';

export function useOrderActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const cancelLeg = useCallback(async (payload: CancelOrderPayload) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await omsApi.cancelProtectiveLeg(payload);
    } catch (err: any) {
      const msg = err?.message || 'Failed to cancel protective leg';
      setActionError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    cancelLeg,
    isSubmitting,
    actionError,
  };
}
