export function hasEntryAppOrder(id: number | string | null | undefined): boolean {
  const value = String(id ?? '').trim();
  return value !== '' && value !== '0';
}

export function legCanBeCancelled(order: { legRole?: string; status?: string; entryAppOrderID?: number | string | null }): boolean {
  const role = (order.legRole || '').toUpperCase();
  const status = (order.status || '').toUpperCase();
  return (role === 'SL' || role === 'TARGET') && (status === 'PENDING' || status === 'ARMED') && !hasEntryAppOrder(order.entryAppOrderID);
}

export function shownOrderStatus(order: { status?: string; parentStatus?: string }): string {
  if ((order.parentStatus || '').toUpperCase() === 'FAILED') return 'FAILED';
  return String(order.status || '');
}

export type LegRole = 'ENTRY' | 'SL' | 'TARGET';

export type LegStatus =
  | 'PENDING'
  | 'PLACED'
  | 'FILLED'
  | 'ARMED'
  | 'FIRING'
  | 'FIRED'
  | 'EXITED'
  | 'CANCELLED'
  | 'REJECTED';

export type ProductType = 'MIS' | 'CNC' | 'NRML' | 'CO';

export interface ProtectiveBookRow {
  omsLegID: number;
  omsOrderID: number;
  legRole: LegRole;
  status: LegStatus;
  entrySide: string; // "BUY" | "SELL"
  orderType: string; // "LIMIT" | "MARKET"
  qty: number;
  filledQty?: number;
  limitPrice?: number;
  triggerPrice: number;
  stopPrice: number;
  trailPoints: number;
  peakLTP: number;
  tpPoints: number;
  limitOffset: number;
  exchangeSegment: string;
  exchangeInstrumentID: number;
  displayName?: string;
  armedAt?: string;
  firedAt?: string;
  createdAt: string;
  updatedAt: string;
  userID: string;
  clientID: string;
  productType: ProductType;
  orderUniqueIdentifier: string;
  validityUntil?: string;
  entryAppOrderID: number | string;
  parentStatus?: string;
}

export interface CancelOrderPayload {
  appOrderID: string;
  clientID: string;
  userID: string;
  reason?: string;
  actor?: string;
}

export interface ExitOrderPayload {
  appOrderID: string;
  clientID: string;
  userID: string;
  reason?: string;
  actor?: string;
}

export interface AuditEventPayload {
  omsOrderID: number;
  omsLegID?: number;
  eventType: string;
  reason: string;
  actor?: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  type: string;
  code?: string;
  description?: string;
  result?: T;
  data?: T;
  error?: string;
}

export const PARENT_STATUSES = [
  'PENDING',
  'PENDING_ENTRY',
  'ENTRY_PLACED',
  'ENTRY_FILLED',
  'SL_ARMED',
  'PROTECTIVE_ARMED',
  'EXITED',
  'CANCELLED',
  'FAILED',
] as const;

export interface ParentOrderRow {
  omsOrderID: number;
  userID: string;
  clientID: string;
  productType: string;
  exchangeSegment: string;
  exchangeInstrumentID: number;
  displayName: string;
  parentStatus: string;
  entryValidity: string;
  validityUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentOrderStats {
  total: number;
  counts: Record<string, number>;
}

export interface OrderHistoryRow extends ParentOrderRow {}

export interface OrderHistoryPaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface PaginatedOrderHistoryResponse {
  data: OrderHistoryRow[];
  pagination: OrderHistoryPaginationMeta;
  stats: ParentOrderStats;
}

export interface OrderHistoryFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  userId?: string;
}


