import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  XCircle,
  Target,
} from 'lucide-react';
import { hasEntryAppOrder, shownOrderStatus, type ProtectiveBookRow } from '../types/oms';
import { StatusBadge, ProductBadge } from './StatusBadge';

interface ProtectiveLegCardProps {
  order: ProtectiveBookRow;
  onCancelLeg: (order: ProtectiveBookRow) => void;
  onCancelEntry: (order: ProtectiveBookRow) => void;
}

export const ProtectiveLegCard: React.FC<ProtectiveLegCardProps> = ({
  order,
  onCancelLeg,
  onCancelEntry,
}) => {
  const isBuy = (order.entrySide || 'BUY').toUpperCase() === 'BUY';
  const role = (order.legRole || '').toUpperCase();
  const status = (order.status || '').toUpperCase();
  const canCancelLeg = (role === 'SL' || role === 'TARGET') && (status === 'PENDING' || status === 'ARMED');
  const canCancelEntry =
    role === 'ENTRY' && status === 'PLACED' && hasEntryAppOrder(order.entryAppOrderID);
  const stopP = Number(order.stopPrice || 0);
  const trigP = Number(order.triggerPrice || 0);
  const trigger = stopP > 0 ? stopP : trigP;
  const limitOffsetNum = Number(order.limitOffset || 0);
  const peakLtpNum = Number(order.peakLTP || 0);

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
    <div className="bg-white border border-[#E6E8EC] rounded-xl p-5 shadow-none hover:border-[#D8DCE3] transition">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E6E8EC]">
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
              isBuy
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {isBuy ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            {order.entrySide || 'BUY'}
          </span>

          <span className="text-sm font-semibold text-[#1A1D23] tracking-tight">
            {order.displayName || '—'}
          </span>

          <ProductBadge product={order.productType} />

          <span className="text-xs px-2 py-0.5 bg-[#F4F6F8] border border-[#E6E8EC] text-[#1A1D23] rounded font-mono">
            {order.legRole || 'LEG'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <StatusBadge status={shownOrderStatus(order) || 'PENDING'} />
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs">
        <div>
          <span className="text-[#6B7280] block mb-0.5">Quantity</span>
          <span className="font-mono text-[#1A1D23] font-semibold text-sm">{order.qty || 0}</span>
        </div>

        <div>
          <span className="text-[#6B7280] block mb-0.5">Trigger / Stop Price</span>
          <span className="font-mono text-amber-800 font-semibold text-sm">
            {trigger > 0 ? `₹${trigger.toFixed(2)}` : '-'}
          </span>
          {limitOffsetNum > 0 && (
            <span className="block text-[10px] text-[#6B7280]">
              Offset: ±₹{limitOffsetNum.toFixed(2)}
            </span>
          )}
        </div>

        <div>
          <span className="text-[#6B7280] block mb-0.5">Trailing SL</span>
          {Number(order.trailPoints || 0) > 0 ? (
            <span className="font-mono text-[#1A1D23]">
              {order.trailPoints} pts {peakLtpNum > 0 ? `(Peak: ₹${peakLtpNum.toFixed(2)})` : ''}
            </span>
          ) : (
            <span className="text-slate-600 font-mono">None</span>
          )}
        </div>

        <div>
          <span className="text-[#6B7280] block mb-0.5">Take-Profit (Target)</span>
          {Number(order.tpPoints || 0) > 0 ? (
            <span className="font-mono text-emerald-800 font-semibold">
              <Target className="inline w-3 h-3 mr-1 text-emerald-700" />
              {order.tpPoints} pts
            </span>
          ) : (
            <span className="text-slate-600 font-mono">None</span>
          )}
        </div>
      </div>

      {/* IDs & Timestamps */}
      <div className="bg-white/60 rounded-lg p-3 border border-[#E6E8EC] text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#5C6570]">
        <div>
          <span className="text-slate-600"> Protective Leg ID: </span>
          <span className="text-indigo-800 font-medium">OMSLEG-{order.omsLegID}</span>
        </div>
        <div>
          <span className="text-slate-600">OMS Order ID: </span>
          <span className="text-[#3A4250]">{order.omsOrderID}</span>
        </div>
        {hasEntryAppOrder(order.entryAppOrderID) && (
          <div>
            <span className="text-slate-600">Symphony Entry ID: </span>
            <span className="text-[#3A4250]">{order.entryAppOrderID}</span>
          </div>
        )}
        <div className="flex items-center text-[#6B7280]">
          <Clock className="w-3 h-3 mr-1 text-slate-600" />
          <span>Armed: {formatDate(order.armedAt || order.createdAt)}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-[#E6E8EC]/60">
        <div className="text-[11px] text-[#6B7280] font-mono">
          User: <span className="text-[#3A4250]">{order.userID}</span> ({order.clientID})
        </div>

        <div className="flex items-center space-x-2">
          {/* Cancel Leg Button */}
          {canCancelLeg && (
            <button
              onClick={() => onCancelLeg(order)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-lg transition"
              title="Cancel this protective SL or Target trigger from Redis/DB"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Cancel Leg
            </button>
          )}

          {canCancelEntry && (
            <button
              onClick={() => onCancelEntry(order)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-[#EEF1F4] hover:bg-[#E6E8EC] text-[#3A4250] border border-[#D8DCE3] rounded-lg transition shadow-xs"
              title="Cancel unfilled entry order on Symphony"
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-[#5C6570]" />
              Cancel Entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
