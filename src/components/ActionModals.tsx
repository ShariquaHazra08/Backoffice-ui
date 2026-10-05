import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { hasEntryAppOrder, legCanBeCancelled, type ParentOrderRow, type ProtectiveBookRow } from '../types/oms';
import { omsApi } from '../api/omsApi';

interface ActionModalProps {
  isOpen: boolean;
  type: 'CANCEL_LEG' | null;
  order: ProtectiveBookRow | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  type,
  order,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !type || !order) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the backoffice audit log.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg bg-white border border-[#E6E8EC] rounded-xl shadow-sm overflow-hidden text-[#1A1D23]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-amber-50 border-amber-100 text-[#1A1D23]">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base">Cancel {order.legRole} Protective Leg</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-[#5C6570] hover:text-[#1A1D23] hover:bg-[#EEF1F4] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <div className="bg-white rounded-lg p-3 text-xs border border-[#E6E8EC] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#5C6570]">User ID:</span>
              <span className="font-mono text-[#1A1D23] font-medium">{order.userID}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6570]">OMS Order ID:</span>
              <span className="font-mono text-[#1A1D23]">{order.omsOrderID}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6570]">Protective Leg ID:</span>
              <span className="font-mono text-indigo-800">OMSLEG-{order.omsLegID}</span>
            </div>
            {hasEntryAppOrder(order.entryAppOrderID) && (
              <div className="flex justify-between">
                <span className="text-[#5C6570]">Symphony Entry ID:</span>
                <span className="font-mono text-[#3A4250]">{order.entryAppOrderID}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#5C6570]">Instrument:</span>
              <span className="font-medium text-[#3A4250]">
                {order.displayName || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6570]">Quantity / Side:</span>
              <span className="font-mono font-medium text-emerald-800">
                {order.qty} Qty ({order.entrySide})
              </span>
            </div>
            {order.filledQty !== undefined && (
              <div className="flex justify-between">
                <span className="text-[#5C6570]">Filled Quantity:</span>
                <span className={`font-mono font-medium ${order.filledQty > 0 ? 'text-emerald-800' : 'text-[#5C6570]'}`}>
                  {order.filledQty} / {order.qty}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg text-xs leading-relaxed border bg-amber-50 border-amber-200 text-amber-900">
            <p>
              <strong>Notice:</strong> This cancels leg <code>OMSLEG-{order.omsLegID}</code> ({order.legRole}) in PostgreSQL and removes the trigger from Redis. The open position itself remains unchanged.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#3A4250] mb-1">
              Backoffice Reason (Required for Audit Trail)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer requested manual square-off via ticket #4819, order entered with typo"
              rows={3}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-[#D8DCE3] rounded-lg text-[#1A1D23] placeholder-[#9AA3B2] focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-[#3A4250] hover:text-[#1A1D23] hover:bg-[#EEF1F4] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg shadow-sm text-white transition bg-amber-600 hover:bg-amber-500 disabled:bg-amber-950 disabled:text-amber-400 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Confirm Cancel Leg
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CancellableLegsModal: React.FC<{
  parent: ParentOrderRow | null;
  refreshToken: number;
  onClose: () => void;
  onCancelSelected: (legs: ProtectiveBookRow[], reason: string) => Promise<void>;
}> = ({ parent, refreshToken, onClose, onCancelSelected }) => {
  const [legs, setLegs] = useState<ProtectiveBookRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parent) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelected(new Set());
    omsApi.getChildLegs(String(parent.omsOrderID))
      .then((rows) => {
        if (!cancelled) setLegs(rows.filter(legCanBeCancelled));
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err?.message || 'Failed to load legs');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [parent, refreshToken]);

  if (!parent) return null;

  const allSelected = legs.length > 0 && legs.every((leg) => selected.has(leg.omsLegID));
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(legs.map((leg) => leg.omsLegID)));
  };
  const toggleOne = (legId: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(legId)) next.delete(legId);
      else next.add(legId);
      return next;
    });
  };

  const handleCancel = async () => {
    const chosen = legs.filter((leg) => selected.has(leg.omsLegID));
    if (chosen.length === 0) return;
    if (!reason.trim()) {
      setError('Please provide a reason.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCancelSelected(chosen, reason.trim());
      setReason('');
      setSelected(new Set());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cancel failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl bg-white border border-[#E6E8EC] rounded-xl shadow-sm overflow-hidden text-[#1A1D23]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E8EC]">
          <h3 className="font-semibold text-base">Cancel legs for OMS order {parent.omsOrderID}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#5C6570] hover:text-[#1A1D23] hover:bg-[#EEF1F4] transition" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-auto">
          {loading ? (
            <p className="py-8 text-center text-xs font-mono text-[#5C6570]">Loading legs…</p>
          ) : error && legs.length === 0 ? (
            <p className="py-8 text-center text-xs text-rose-700">{error}</p>
          ) : legs.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#1A1D23]">No legs can be cancelled for this order.</p>
          ) : (
            <table className="w-full text-left text-xs text-[#3A4250]">
              <thead className="text-[11px] uppercase tracking-wider text-[#5C6570] font-mono">
                <tr>
                  <th className="py-2 px-2 w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all legs" className="accent-rose-600" />
                  </th>
                  <th className="py-2 px-2">Leg id</th>
                  <th className="py-2 px-2">Role</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {legs.map((leg) => (
                  <tr key={leg.omsLegID} className="border-t border-[#EEF1F4]">
                    <td className="py-2 px-2">
                      <input
                        type="checkbox"
                        checked={selected.has(leg.omsLegID)}
                        onChange={() => toggleOne(leg.omsLegID)}
                        aria-label={`Select leg ${leg.omsLegID}`}
                        className="accent-rose-600"
                      />
                    </td>
                    <td className="py-2 px-2 font-mono">{leg.omsLegID}</td>
                    <td className="py-2 px-2 font-mono">{leg.legRole}</td>
                    <td className="py-2 px-2 font-mono">{leg.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {legs.length > 0 && (
          <div className="px-4 py-3 border-t border-[#E6E8EC] space-y-3">
            <label className="block text-xs font-medium text-[#3A4250]">
              Reason
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={2}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-[#D8DCE3] rounded-lg text-[#1A1D23] focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </label>
            {error && <p className="text-xs text-rose-700">{error}</p>}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={selected.size === 0 || submitting}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-white hover:bg-rose-50 border border-rose-300 text-[11px] font-semibold text-rose-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
