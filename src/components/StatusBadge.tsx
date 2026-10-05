import React from 'react';
import type { LegStatus, ProductType } from '../types/oms';

interface StatusBadgeProps {
  status: LegStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = String(status || 'PENDING').toUpperCase();

  let dot = 'bg-slate-400';

  switch (s) {
    case 'ARMED':
    case 'PROTECTIVE_ARMED':
      dot = 'bg-emerald-600';
      break;
    case 'FILLED':
    case 'ENTRY_FILLED':
      dot = 'bg-sky-600';
      break;
    case 'PLACED':
    case 'ENTRY_PLACED':
      dot = 'bg-sky-500';
      break;
    case 'FIRING':
    case 'PENDING':
      dot = 'bg-amber-500';
      break;
    case 'FIRED':
    case 'EXITED':
      dot = 'bg-slate-500';
      break;
    case 'CANCELLED':
    case 'REJECTED':
    case 'FAILED':
      dot = 'bg-rose-600';
      break;
  }

  return (
    <span className="inline-flex items-center text-[11px] font-medium tracking-wide text-[#3A4250]">
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot}`} />
      {s}
    </span>
  );
};

export const ProductBadge: React.FC<{ product: ProductType | string }> = ({ product }) => {
  const p = String(product || '').trim().toUpperCase();
  if (!p) {
    return <span className="text-[11px] font-mono text-[#6B7280]">—</span>;
  }
  let color = 'bg-[#F4F6F8] text-[#1A1D23] border-[#E6E8EC]';
  if (p === 'MIS') color = 'bg-amber-50 text-amber-800 border-amber-200';
  if (p === 'CNC') color = 'bg-indigo-50 text-indigo-800 border-indigo-200';
  if (p === 'NRML') color = 'bg-sky-50 text-sky-800 border-sky-200';

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${color}`}>
      {p}
    </span>
  );
};
