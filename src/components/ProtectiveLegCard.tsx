import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  XCircle,
  LogOut,
  Target,
} from 'lucide-react';
import type { ProtectiveBookRow } from '../types/oms';
import { StatusBadge, ProductBadge } from './StatusBadge';

interface ProtectiveLegCardProps {
  order: ProtectiveBookRow;
  onCancelLeg: (order: ProtectiveBookRow) => void;
  onForceExit: (order: ProtectiveBookRow) => void;
  onCancelEntry: (order: ProtectiveBookRow) => void;
}

export const ProtectiveLegCard: React.FC<ProtectiveLegCardProps> = ({
  order,
  onCancelLeg,
  onForceExit,
  onCancelEntry,
}) => {
  const isBuy = (order.entrySide || 'BUY').toUpperCase() === 'BUY';
  const isArmed = (order.status || '').toUpperCase() === 'ARMED';
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md hover:border-slate-700 transition">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
              isBuy
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}
          >
            {isBuy ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            {order.entrySide || 'BUY'}
          </span>

          <span className="font-mono text-sm font-semibold text-white tracking-tight">
            {order.exchangeSegment || 'NSEFO'}:{order.exchangeInstrumentID || 0}
          </span>

          <ProductBadge product={order.productType || 'MIS'} />

          <span className="text-xs px-2 py-0.5 bg-slate-950 border border-slate-800 text-indigo-300 rounded font-mono">
            {order.legRole || 'LEG'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <StatusBadge status={order.status || 'PENDING'} />
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs">
        <div>
          <span className="text-slate-500 block mb-0.5">Quantity</span>
          <span className="font-mono text-slate-200 font-semibold text-sm">{order.qty || 0}</span>
        </div>

        <div>
          <span className="text-slate-500 block mb-0.5">Trigger / Stop Price</span>
          <span className="font-mono text-amber-400 font-semibold text-sm">
            {trigger > 0 ? `₹${trigger.toFixed(2)}` : '-'}
          </span>
          {limitOffsetNum > 0 && (
            <span className="block text-[10px] text-slate-500">
              Offset: ±₹{limitOffsetNum.toFixed(2)}
            </span>
          )}
        </div>

        <div>
          <span className="text-slate-500 block mb-0.5">Trailing SL</span>
          {Number(order.trailPoints || 0) > 0 ? (
            <span className="font-mono text-purple-300">
              {order.trailPoints} pts {peakLtpNum > 0 ? `(Peak: ₹${peakLtpNum.toFixed(2)})` : ''}
            </span>
          ) : (
            <span className="text-slate-600 font-mono">None</span>
          )}
        </div>

        <div>
          <span className="text-slate-500 block mb-0.5">Take-Profit (Target)</span>
          {Number(order.tpPoints || 0) > 0 ? (
            <span className="font-mono text-emerald-400 font-semibold">
              <Target className="inline w-3 h-3 mr-1 text-emerald-400" />
              {order.tpPoints} pts
            </span>
          ) : (
            <span className="text-slate-600 font-mono">None</span>
          )}
        </div>
      </div>

      {/* IDs & Timestamps */}
      <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
        <div>
          <span className="text-slate-600">Synthetic AppOrderID: </span>
          <span className="text-indigo-400 font-medium">OMSLEG-{order.omsLegID}</span>
        </div>
        <div>
          <span className="text-slate-600">OMS Order ID: </span>
          <span className="text-slate-300">{order.omsOrderID}</span>
        </div>
        {order.entryAppOrderID > 0 && (
          <div>
            <span className="text-slate-600">Symphony Entry ID: </span>
            <span className="text-slate-300">{order.entryAppOrderID}</span>
          </div>
        )}
        <div className="flex items-center text-slate-500">
          <Clock className="w-3 h-3 mr-1 text-slate-600" />
          <span>Armed: {formatDate(order.armedAt || order.createdAt)}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-800/60">
        <div className="text-[11px] text-slate-500 font-mono">
          User: <span className="text-slate-300">{order.userID}</span> ({order.clientID})
        </div>

        <div className="flex items-center space-x-2">
          {/* Cancel Leg Button */}
          {isArmed && (
            <button
              onClick={() => onCancelLeg(order)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 rounded-lg transition shadow-xs"
              title="Cancel this protective SL or Target trigger from Redis/DB"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Cancel Leg
            </button>
          )}

          {/* Cancel Unfilled Entry Button (if Symphony entry id exists and entry not filled) */}
          {order.entryAppOrderID > 0 && (
            <button
              onClick={() => onCancelEntry(order)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition shadow-xs"
              title="Cancel unfilled entry order on Symphony"
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Cancel Entry
            </button>
          )}

          {/* Force Exit Position Button */}
          <button
            onClick={() => onForceExit(order)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 rounded-lg transition shadow-xs"
            title="Place market square-off order on Symphony to exit filled position"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Force Exit Position
          </button>
        </div>
      </div>
    </div>
  );
};
