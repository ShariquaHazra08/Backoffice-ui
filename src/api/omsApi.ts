import axios from 'axios';
import type {
  ProtectiveBookRow,
  CancelOrderPayload,
  ExitOrderPayload,
  UserSummary,
  PaginatedOrderHistoryResponse,
  OrderHistoryFilterParams,
} from '../types/oms';

export const getApiConfig = () => {
  const baseUrl = localStorage.getItem('oms_api_url') || import.meta.env.VITE_OMS_BASE_URL || '/api/v1/oms';
  const internalKey = localStorage.getItem('oms_internal_key') || import.meta.env.VITE_OMS_INTERNAL_KEY || '';
  return { baseUrl, internalKey };
};

export const setApiConfig = (baseUrl: string, internalKey: string) => {
  localStorage.setItem('oms_api_url', baseUrl);
  localStorage.setItem('oms_internal_key', internalKey);
};

const createClient = () => {
  const { baseUrl, internalKey } = getApiConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (internalKey) {
    headers['X-Internal-Key'] = internalKey;
  }
  return axios.create({
    baseURL: baseUrl,
    headers,
    timeout: 10000,
  });
};

const formatApiError = (err: any): Error => {
  if (err.response) {
    const msg =
      err.response.data?.message ||
      err.response.data?.error ||
      `Server Error (HTTP ${err.response.status})`;
    return new Error(msg);
  }
  if (err.request) {
    return new Error('OMS Worker unreachable (:8089). Please ensure the backend is running.');
  }
  return new Error(err.message || 'Unknown network error');
};

const normalizeOrderRow = (r: any): ProtectiveBookRow => ({
  omsLegID: Number(r.omsLegID ?? r.omslegid ?? 0),
  omsOrderID: Number(r.omsOrderID ?? r.omsorderid ?? 0),
  legRole: (r.legRole ?? r.legrole ?? 'ENTRY') as any,
  status: (r.status ?? 'PENDING') as any,
  entrySide: String(r.entrySide ?? r.entryside ?? 'BUY'),
  orderType: String(r.orderType ?? r.ordertype ?? 'MARKET'),
  qty: Number(r.qty ?? 0),
  triggerPrice: Number(r.triggerPrice ?? r.triggerprice ?? 0),
  stopPrice: Number(r.stopPrice ?? r.stopprice ?? 0),
  trailPoints: Number(r.trailPoints ?? r.trailpoints ?? 0),
  peakLTP: Number(r.peakLTP ?? r.peakltp ?? 0),
  tpPoints: Number(r.tpPoints ?? r.tppoints ?? 0),
  limitOffset: Number(r.limitOffset ?? r.limitoffset ?? 0),
  exchangeSegment: String(r.exchangeSegment ?? r.exchangesegment ?? 'NSEFO'),
  exchangeInstrumentID: Number(r.exchangeInstrumentID ?? r.exchangeinstrumentid ?? 0),
  armedAt: r.armedAt ?? r.armedat,
  createdAt: String(r.createdAt ?? r.createdat ?? new Date().toISOString()),
  updatedAt: String(r.updatedAt ?? r.updatedat ?? new Date().toISOString()),
  userID: String(r.userID ?? r.userid ?? ''),
  clientID: String(r.clientID ?? r.clientid ?? ''),
  productType: (r.productType ?? r.producttype ?? 'MIS') as any,
  orderUniqueIdentifier: String(r.orderUniqueIdentifier ?? r.orderuniqueidentifier ?? ''),
  entryAppOrderID: Number(r.entryAppOrderID ?? r.entryapporderid ?? 0),
});

export const omsApi = {
  // Check live health of oms-worker
  async checkHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      const res = await axios.get('/health', { timeout: 3000 });
      return { healthy: res.status === 200, details: res.data };
    } catch {
      return { healthy: false };
    }
  },

  // Fetch all users summary from backoffice API
  async getUsers(): Promise<UserSummary[]> {
    try {
      const res = await axios.get('/api/backoffice/users', { timeout: 5000 });
      if (res.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err: any) {
      console.warn('Failed to load users list:', err?.message);
      return [];
    }
  },

  // Fetch paginated master order history across all traders
  async getOrderHistory(params: OrderHistoryFilterParams = {}): Promise<PaginatedOrderHistoryResponse> {
    try {
      const queryParams: Record<string, string | number> = {
        page: params.page || 1,
        limit: params.limit || 25,
      };
      if (params.status && params.status !== 'ALL') {
        queryParams.status = params.status;
      }
      if (params.search && params.search.trim()) {
        queryParams.search = params.search.trim();
      }
      if (params.userId && params.userId.trim()) {
        queryParams.user_id = params.userId.trim();
      }

      const response = await axios.get('/api/backoffice/orders/history', {
        params: queryParams,
        timeout: 10000,
      });

      const resData = response.data || {};
      const rows: any[] = Array.isArray(resData.data) ? resData.data : [];
      const normalizedData = rows.map((r) => ({
        ...normalizeOrderRow(r),
        fullCount: Number(r.fullCount ?? r.fullcount ?? 0),
      }));

      return {
        data: normalizedData,
        pagination: resData.pagination || {
          page: params.page || 1,
          limit: params.limit || 25,
          totalRecords: normalizedData.length > 0 ? (normalizedData[0].fullCount || 0) : 0,
          totalPages: Math.max(1, Math.ceil((normalizedData.length > 0 ? (normalizedData[0].fullCount || 0) : 0) / (params.limit || 25))),
        },
        stats: resData.stats || {
          total: 0,
          armed: 0,
          filled: 0,
          cancelled: 0,
          pending: 0,
          exited: 0,
          active_traders: 0,
        },
      };
    } catch (err: any) {
      throw formatApiError(err);
    }
  },

  // Fetch full protective legs / order book history across all statuses for a given user
  async getProtectives(userId: string, appOrderId?: string): Promise<ProtectiveBookRow[]> {
    try {
      const params: Record<string, string> = { user_id: userId.trim() };
      if (appOrderId && appOrderId.trim()) {
        params.app_order_id = appOrderId.trim();
      }
      const response = await axios.get('/api/backoffice/orders', { params, timeout: 10000 });
      let list: any[] = [];
      if (response.data && Array.isArray(response.data.data)) {
        list = response.data.data;
      } else if (Array.isArray(response.data)) {
        list = response.data;
      }
      return list.map(normalizeOrderRow);
    } catch (err: any) {
      throw formatApiError(err);
    }
  },

  // Cancel an unplaced/armed protective leg (SL or TARGET) using OMSLEG-{id}
  async cancelProtectiveLeg(payload: CancelOrderPayload): Promise<void> {
    try {
      const client = createClient();
      await client.post('/orders/smart-intraday/cancel-protective', {
        appOrderID: payload.appOrderID,
        clientID: payload.clientID || payload.userID,
        userID: payload.userID,
      });
    } catch (err: any) {
      throw formatApiError(err);
    }
  },

  // Cancel an unfilled entry order and its OMS parent
  async cancelEntryOrder(payload: CancelOrderPayload): Promise<void> {
    try {
      const client = createClient();
      await client.post('/orders/smart-intraday/cancel', {
        appOrderID: payload.appOrderID,
        clientID: payload.clientID || payload.userID,
        userID: payload.userID,
      });
    } catch (err: any) {
      throw formatApiError(err);
    }
  },

  // Force exit / square-off filled quantity for an OMS order on user's behalf
  async exitSmartIntraday(payload: ExitOrderPayload): Promise<void> {
    try {
      const client = createClient();
      await client.post('/orders/smart-intraday/exit', {
        appOrderID: payload.appOrderID,
        clientID: payload.clientID || payload.userID,
        userID: payload.userID,
      });
    } catch (err: any) {
      throw formatApiError(err);
    }
  },
};
