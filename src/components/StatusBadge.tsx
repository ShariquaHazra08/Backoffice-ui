import React from 'react';
import type { LegStatus, ProductType } from '../types/oms';

interface StatusBadgeProps {
  status: LegStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = String(status || 'PENDING').toUpperCase();

  let colorClasses = 'bg-gray-800 text-gray-300 border-gray-700';

  switch (s) {
    case 'ARMED':
    case 'PROTECTIVE_ARMED':
      colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60';
      break;
    case 'FILLED':
    case 'ENTRY_FILLED':
      colorClasses = 'bg-blue-950/60 text-blue-400 border-blue-700/60';
      break;
    case 'PLACED':
    case 'ENTRY_PLACED':
      colorClasses = 'bg-sky-950/60 text-sky-400 border-sky-700/60';
      break;
    case 'FIRING':
      colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-600 animate-pulse';
      break;
    case 'FIRED':
    case 'EXITED':
      colorClasses = 'bg-purple-950/60 text-purple-300 border-purple-700/60';
      break;
    case 'CANCELLED':
      colorClasses = 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      break;
    case 'PENDING':
      colorClasses = 'bg-yellow-950/60 text-yellow-400 border-yellow-700/60';
      break;
    case 'REJECTED':
    case 'FAILED':
      colorClasses = 'bg-red-950/80 text-red-300 border-red-700';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {s}
    </span>
  );
};

export const ProductBadge: React.FC<{ product: ProductType | string }> = ({ product }) => {
  const p = String(product || 'MIS').toUpperCase();
  let color = 'bg-slate-800 text-slate-300 border-slate-700';
  if (p === 'MIS') color = 'bg-amber-950/50 text-amber-400 border-amber-800/50';
  if (p === 'CNC') color = 'bg-indigo-950/50 text-indigo-400 border-indigo-800/50';
  if (p === 'NRML') color = 'bg-cyan-950/50 text-cyan-400 border-cyan-800/50';

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${color}`}>
      {p}
    </span>
  );
};
