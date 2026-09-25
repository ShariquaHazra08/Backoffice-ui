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
  triggerPrice: number;
  stopPrice: number;
  trailPoints: number;
  peakLTP: number;
  tpPoints: number;
  limitOffset: number;
  exchangeSegment: string;
  exchangeInstrumentID: number;
  armedAt?: string;
  createdAt: string;
  updatedAt: string;
  userID: string;
  clientID: string;
  productType: ProductType;
  orderUniqueIdentifier: string;
  validityUntil?: string;
  entryAppOrderID: number;
}

export interface CancelOrderPayload {
  appOrderID: string;
  clientID: string;
  userID: string;
}

export interface ExitOrderPayload {
  appOrderID: string;
  clientID: string;
  userID: string;
}

export interface ApiResponse<T = any> {
  type: string;
  code?: string;
  description?: string;
  result?: T;
  data?: T;
  error?: string;
}

export interface UserSummary {
  user_id: string;
  client_id: string;
  total_orders: number;
  armed_legs_count: number;
  filled_legs_count: number;
  cancelled_legs_count: number;
  last_active: string;
}

export interface OrderHistoryStats {
  total: number;
  armed: number;
  filled: number;
  cancelled: number;
  pending: number;
  exited: number;
  active_traders: number;
}

export interface OrderHistoryRow extends ProtectiveBookRow {
  fullCount?: number;
}

export interface OrderHistoryPaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface PaginatedOrderHistoryResponse {
  data: OrderHistoryRow[];
  pagination: OrderHistoryPaginationMeta;
  stats: OrderHistoryStats;
}

export interface OrderHistoryFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  userId?: string;
}


