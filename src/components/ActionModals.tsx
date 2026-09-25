import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, X, Loader2 } from 'lucide-react';
import type { ProtectiveBookRow } from '../types/oms';

interface ActionModalProps {
  isOpen: boolean;
  type: 'CANCEL_LEG' | 'FORCE_EXIT' | 'CANCEL_ENTRY' | null;
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

  const isExit = type === 'FORCE_EXIT';
  const isCancelLeg = type === 'CANCEL_LEG';
  const isCancelEntry = type === 'CANCEL_ENTRY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isExit
              ? 'bg-rose-950/40 border-rose-900/50 text-rose-300'
              : 'bg-amber-950/40 border-amber-900/50 text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isExit ? (
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <h3 className="font-semibold text-base">
              {isExit && 'Force Exit / Square-Off Position'}
              {isCancelLeg && `Cancel ${order.legRole} Protective Leg`}
              {isCancelEntry && 'Cancel Unfilled Entry Order'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <div className="bg-slate-950/80 rounded-lg p-3 text-xs border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">User ID:</span>
              <span className="font-mono text-white font-medium">{order.userID}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OMS Order ID:</span>
              <span className="font-mono text-white">{order.omsOrderID}</span>
            </div>
            {isCancelLeg && (
              <div className="flex justify-between">
                <span className="text-slate-400">Synthetic AppOrderID:</span>
                <span className="font-mono text-indigo-400">OMSLEG-{order.omsLegID}</span>
              </div>
            )}
            {order.entryAppOrderID > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Symphony Entry ID:</span>
                <span className="font-mono text-slate-300">{order.entryAppOrderID}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Instrument:</span>
              <span className="font-mono text-slate-300">
                {order.exchangeSegment}:{order.exchangeInstrumentID}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quantity / Side:</span>
              <span className="font-mono font-medium text-emerald-400">
                {order.qty} Qty ({order.entrySide})
              </span>
            </div>
          </div>

          <div
            className={`p-3 rounded-lg text-xs leading-relaxed border ${
              isExit
                ? 'bg-rose-950/30 border-rose-900/40 text-rose-300'
                : 'bg-amber-950/30 border-amber-900/40 text-amber-300'
            }`}
          >
            {isExit && (
              <p>
                <strong>Warning:</strong> This will place an immediate MARKET square-off order on Symphony to close the filled position on behalf of user <code>{order.userID}</code>, and will disarm any active Stop-Loss/Target legs.
              </p>
            )}
            {isCancelLeg && (
              <p>
                <strong>Notice:</strong> This cancels leg <code>OMSLEG-{order.omsLegID}</code> ({order.legRole}) in PostgreSQL and removes the trigger from Redis. The open position itself remains unchanged.
              </p>
            )}
            {isCancelEntry && (
              <p>
                <strong>Notice:</strong> This cancels the unfilled entry order with Symphony and marks the entire OMS parent as CANCELLED.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Backoffice Reason (Required for Audit Trail)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer requested manual square-off via ticket #4819, order entered with typo"
              rows={3}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg shadow-sm text-white transition ${
                isExit
                  ? 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900'
                  : 'bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900'
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {isExit && 'Confirm Force Exit'}
              {isCancelLeg && 'Confirm Cancel Leg'}
              {isCancelEntry && 'Confirm Cancel Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
