import React from 'react';
import { hasEntryAppOrder, type ProtectiveBookRow } from '../types/oms';

interface TraderOrdersViewProps {
  legs: ProtectiveBookRow[];
  ordersLoading: boolean;
  error?: string | null;
  onCollapse?: () => void;
}

const formatWhen = (d?: string) => {
  if (!d) return '—';
  try {
    const dateObj = new Date(d);
    return `${dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${dateObj.toLocaleTimeString('en-IN', { hour12: false })}`;
  } catch {
    return d;
  }
};

export const TraderOrdersView: React.FC<TraderOrdersViewProps> = ({
  legs,
  ordersLoading,
  error,
  onCollapse,
}) => {

  return (
    <div className="bg-[#F8F9FB] cursor-pointer" onClick={() => onCollapse?.()}>
      <div className="overflow-x-auto">
          <table className="w-max min-w-full border-separate border-spacing-0 text-left text-xs text-[#3A4250] font-sans">
            <thead className="bg-white text-[11px] uppercase tracking-wider text-[#5C6570] font-mono sticky top-0 z-10 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-[#E6E8EC] [&_th]:bg-white [&_th]:align-middle">
              <tr>
                <th className="py-3 px-4">Leg id</th>
                <th className="py-3 px-4">Symphony id</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Filled</th>
                <th className="py-3 px-4">Limit price</th>
                <th className="py-3 px-4">Trigger price</th>
                <th className="py-3 px-4">Stop price</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4">Instrument id</th>
                <th className="py-3 px-4">Trail points</th>
                <th className="py-3 px-4">Peak LTP</th>
                <th className="py-3 px-4">TP points</th>
                <th className="py-3 px-4">Limit offset</th>
                <th className="py-3 px-4">Armed at</th>
                <th className="py-3 px-4">Fired at</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Updated</th>
              </tr>
            </thead>
            <tbody className="[&_td]:border-b [&_td]:border-[#EEF1F4] [&_td]:align-middle">
              {ordersLoading && legs.length === 0 ? (
                <tr>
                  <td colSpan={21} className="py-8 text-center text-[#5C6570] font-mono">
                    Loading legs…
                  </td>
                </tr>
              ) : error && legs.length === 0 ? (
                <tr>
                  <td colSpan={21} className="py-8 text-center text-xs text-rose-700">
                    {error}
                  </td>
                </tr>
              ) : legs.length === 0 ? (
                <tr>
                  <td colSpan={21} className="py-8 text-center">
                    <p className="text-sm font-semibold text-[#1A1D23]">No legs found</p>
                    <p className="text-xs text-[#5C6570] mt-1">This parent has no legs.</p>
                  </td>
                </tr>
              ) : (
                legs.map((order) => {
                  const role = (order.legRole || '').toUpperCase();
                  const status = (order.status || '').toUpperCase();
                  const price = (value?: number) => (value == null || Number.isNaN(Number(value)) ? '—' : Number(value).toFixed(2));
                  return (
                    <tr key={order.omsLegID} className="hover:bg-[#F4F6F8]">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{order.omsLegID}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        {hasEntryAppOrder(order.entryAppOrderID) ? order.entryAppOrderID : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{role || '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{status || '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{order.entrySide || '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{order.orderType || '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{order.qty}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{order.filledQty ?? 0}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{price(order.limitPrice)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{price(order.triggerPrice)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{price(order.stopPrice)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{order.exchangeSegment || '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{order.exchangeInstrumentID || '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{price(order.trailPoints)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{price(order.peakLTP)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{price(order.tpPoints)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{price(order.limitOffset)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{formatWhen(order.armedAt)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{formatWhen(order.firedAt)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{formatWhen(order.createdAt)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">{formatWhen(order.updatedAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
};
