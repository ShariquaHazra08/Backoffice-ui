import type {
  ParentOrderRow,
  ProtectiveBookRow,
  CancelOrderPayload,
  PaginatedOrderHistoryResponse,
  OrderHistoryFilterParams,
  AuditEventPayload,
} from '../types/oms';

export const getApiConfig = () => {
  const fromEnv = String(import.meta.env.VITE_OMS_BASE_URL || '').trim();
  const fromSettings = localStorage.getItem('oms_api_url') || '';
  const baseUrl = fromEnv || fromSettings || '/api/v1/oms';
  const keyFromEnv = String(import.meta.env.VITE_OMS_INTERNAL_KEY || '').trim();
  const internalKey = keyFromEnv || localStorage.getItem('oms_internal_key') || '';
  return { baseUrl, internalKey };
};

export const setApiConfig = (baseUrl: string, internalKey: string) => {
  localStorage.setItem('oms_api_url', baseUrl);
  localStorage.setItem('oms_internal_key', internalKey);
};

type JsonBody = Record<string, unknown> | unknown;

const formatApiError = async (res: Response): Promise<Error> => {
  try {
    const data = await res.json();
    const msg =
      (data as any)?.message ||
      (data as any)?.error ||
      `Server Error (HTTP ${res.status})`;
    return new Error(msg);
  } catch {
    return new Error(`Server Error (HTTP ${res.status})`);
  }
};

const request = async <T = any>(
  url: string,
  options: {
    method?: string;
    body?: JsonBody;
    headers?: Record<string, string>;
    timeoutMs?: number;
    baseURL?: string;
  } = {}
): Promise<T> => {
  const { method = 'GET', body, headers = {}, timeoutMs = 10000, baseURL = '' } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseURL}${url}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw await formatApiError(res);
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (err: any) {
    if (err?.name === 'AbortError' || err instanceof TypeError) {
      throw new Error('OMS Backend unreachable. Please ensure the backend service is running.');
    }
    if (err instanceof Error && err.message) throw err;
    throw new Error('OMS Backend unreachable. Please ensure the backend service is running.');
  } finally {
    clearTimeout(timer);
  }
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
};

const omsBase = () => getApiConfig().baseUrl.replace(/\/$/, '');

const healthUrl = () => {
  const base = omsBase();
  if (/^https?:\/\//i.test(base)) {
    return `${new URL(base).origin}/health`;
  }
  return '/health';
};

const authHeaders = (): Record<string, string> => {
  const { internalKey } = getApiConfig();
  return internalKey ? { 'X-Internal-Key': internalKey } : {};
};

const omsRequest = async <T>(
  path: string,
  options: { method?: string; body?: JsonBody; timeoutMs?: number } = {}
): Promise<Envelope<T>> => {
  return request<Envelope<T>>(path.startsWith('/') ? path : `/${path}`, {
    method: options.method,
    body: options.body,
    headers: authHeaders(),
    timeoutMs: options.timeoutMs ?? 10000,
    baseURL: omsBase(),
  });
};

const omsClientPost = async (path: string, payload: JsonBody) => {
  return omsRequest(path, { method: 'POST', body: payload });
};

const normalizeParentRow = (r: any): ParentOrderRow => ({
  omsOrderID: Number(r.omsOrderID ?? r.omsorderid ?? 0),
  userID: String(r.userID ?? r.userid ?? ''),
  clientID: String(r.clientID ?? r.clientid ?? ''),
  productType: String(r.productType ?? r.producttype ?? ''),
  exchangeSegment: String(r.exchangeSegment ?? r.exchangesegment ?? ''),
  exchangeInstrumentID: Number(r.exchangeInstrumentID ?? r.exchangeinstrumentid ?? 0),
  displayName: String(r.displayName ?? r.displayname ?? ''),
  parentStatus: String(r.parentStatus ?? r.parentstatus ?? ''),
  entryValidity: String(r.entryValidity ?? r.entryvalidity ?? ''),
  validityUntil: r.validityUntil || r.validityuntil || undefined,
  createdAt: String(r.createdAt ?? r.createdat ?? ''),
  updatedAt: String(r.updatedAt ?? r.updatedat ?? ''),
});

const normalizeOrderRow = (r: any): ProtectiveBookRow => ({
  omsLegID: Number(r.omsLegID ?? r.omslegid ?? 0),
  omsOrderID: Number(r.omsOrderID ?? r.omsorderid ?? 0),
  legRole: (r.legRole ?? r.legrole ?? 'ENTRY') as any,
  status: (r.status ?? 'PENDING') as any,
  entrySide: String(r.entrySide ?? r.entryside ?? 'BUY'),
  orderType: String(r.orderType ?? r.ordertype ?? 'MARKET'),
  qty: Number(r.qty ?? 0),
  filledQty: Number(r.filledQty ?? r.filledqty ?? 0),
  limitPrice: Number(r.limitPrice ?? r.limitprice ?? 0),
  triggerPrice: Number(r.triggerPrice ?? r.triggerprice ?? 0),
  stopPrice: Number(r.stopPrice ?? r.stopprice ?? 0),
  trailPoints: Number(r.trailPoints ?? r.trailpoints ?? 0),
  peakLTP: Number(r.peakLTP ?? r.peakltp ?? 0),
  tpPoints: Number(r.tpPoints ?? r.tppoints ?? 0),
  limitOffset: Number(r.limitOffset ?? r.limitoffset ?? 0),
  exchangeSegment: String(r.exchangeSegment ?? r.exchangesegment ?? ''),
  exchangeInstrumentID: Number(r.exchangeInstrumentID ?? r.exchangeinstrumentid ?? 0),
  displayName: String(r.displayName ?? r.displayname ?? ''),
  armedAt: r.armedAt ?? r.armedat,
  firedAt: r.firedAt ?? r.firedat,
  createdAt: String(r.createdAt ?? r.createdat ?? new Date().toISOString()),
  updatedAt: String(r.updatedAt ?? r.updatedat ?? new Date().toISOString()),
  userID: String(r.userID ?? r.userid ?? ''),
  clientID: String(r.clientID ?? r.clientid ?? ''),
  productType: (r.productType ?? r.producttype ?? '') as any,
  orderUniqueIdentifier: String(r.orderUniqueIdentifier ?? r.orderuniqueidentifier ?? ''),
  entryAppOrderID: r.entryAppOrderID != null && r.entryAppOrderID !== '' ? String(r.entryAppOrderID) : '0',
  parentStatus: String(r.parentStatus ?? r.parentstatus ?? ''),
});

export const omsApi = {
  async checkHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      const details = await request<{ status?: string }>(healthUrl(), { timeoutMs: 3000 });
      return { healthy: details?.status === 'healthy', details };
    } catch {
      return { healthy: false };
    }
  },

  async getParentOrders(params: OrderHistoryFilterParams = {}): Promise<PaginatedOrderHistoryResponse> {
    const query = new URLSearchParams();
    query.set('page', String(params.page || 1));
    query.set('limit', String(params.limit || 25));
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.search && params.search.trim()) query.set('search', params.search.trim());
    if (params.userId && params.userId.trim()) query.set('user_id', params.userId.trim());

    const resData = await omsRequest<{
      rows?: unknown[];
      pagination?: PaginatedOrderHistoryResponse['pagination'];
      stats?: PaginatedOrderHistoryResponse['stats'];
    }>(`/backoffice/orders?${query.toString()}`);

    const page = resData.data;
    const rows = Array.isArray(page?.rows) ? page.rows : [];
    const rawStats = page?.stats as { total?: number; counts?: Record<string, number> } | undefined;
    const pagination = page?.pagination;

    return {
      data: rows.map((r) => normalizeParentRow(r)),
      pagination: {
        page: Number(pagination?.page || params.page || 1),
        limit: Number(pagination?.limit || params.limit || 25),
        totalRecords: Number(pagination?.totalRecords || 0),
        totalPages: Number(pagination?.totalPages || 1),
      },
      stats: {
        total: Number(rawStats?.total || 0),
        counts: rawStats?.counts || {},
      },
    };
  },

  async getChildLegs(omsOrderId: string): Promise<ProtectiveBookRow[]> {
    const query = new URLSearchParams({ oms_order_id: omsOrderId.trim() });
    const response = await omsRequest<unknown[]>(`/backoffice/orders/leg?${query.toString()}`);
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((row) => normalizeOrderRow(row));
  },

  async getProtectives(userId: string, appOrderId?: string): Promise<ProtectiveBookRow[]> {
    const query = new URLSearchParams({ user_id: userId.trim() });
    if (appOrderId && appOrderId.trim()) query.set('app_order_id', appOrderId.trim());
    const response = await omsRequest<unknown[]>(`/backoffice/orders?${query.toString()}`);
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((row) => normalizeOrderRow(row));
  },

  async cancelProtectiveLeg(payload: CancelOrderPayload): Promise<void> {
    await omsClientPost('/orders/smart-intraday/cancel-protective', {
      appOrderID: payload.appOrderID,
      clientID: payload.clientID || payload.userID,
      userID: payload.userID,
      reason: payload.reason || '',
    });
  },

  async logAuditEvent(payload: AuditEventPayload): Promise<void> {
    await omsClientPost('/backoffice/audit/log', {
      eventType: payload.eventType,
      omsOrderID: payload.omsOrderID,
      omsLegID: payload.omsLegID,
      reason: payload.reason,
      actor: payload.actor || 'BACKOFFICE_OPERATOR',
      userID: payload.metadata?.userID,
      metadata: payload.metadata,
    });
  },
};
