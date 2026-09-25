import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { exec } from 'node:child_process';

const backofficeApiPlugin = (): Plugin => ({
  name: 'backoffice-api-plugin',
  configureServer(server) {
    // 1. Directory of all traders
    server.middlewares.use('/api/backoffice/users', (_req, res) => {
      const sql = `
        SELECT json_build_object(
          'success', true,
          'data', COALESCE(json_agg(u), '[]'::json)
        )
        FROM (
          SELECT 
            p.user_id,
            p.client_id,
            COUNT(DISTINCT p.oms_order_id)::int AS total_orders,
            COUNT(l.oms_leg_id) FILTER (WHERE l.status = 'ARMED')::int AS armed_legs_count,
            COUNT(l.oms_leg_id) FILTER (WHERE l.status = 'FILLED')::int AS filled_legs_count,
            COUNT(l.oms_leg_id) FILTER (WHERE l.status = 'CANCELLED')::int AS cancelled_legs_count,
            MAX(p.updated_at) AS last_active
          FROM oms_parents p
          LEFT JOIN oms_legs l ON l.oms_order_id = p.oms_order_id
          GROUP BY p.user_id, p.client_id
          ORDER BY armed_legs_count DESC, last_active DESC
        ) u;
      `;
      exec(
        `PGPASSWORD=postgres psql -h localhost -U postgres -d oms -t -A -c "${sql.replace(/\s+/g, ' ').trim()}"`,
        (error, stdout) => {
          res.setHeader('Content-Type', 'application/json');
          if (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: error.message }));
            return;
          }
          res.statusCode = 200;
          res.end(stdout.trim() || '{"success":true,"data":[]}');
        }
      );
    });

    // 2. Orders endpoint: Handles both paginated global history and per-user detail
    server.middlewares.use('/api/backoffice/orders', (req, res) => {
      const parsedUrl = new URL(req.url || '', 'http://localhost');

      // 2A. Global Paginated Order History across all users
      if (parsedUrl.pathname === '/history' || parsedUrl.pathname === '/history/') {
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(5, parseInt(parsedUrl.searchParams.get('limit') || '25', 10)));
        const offset = (page - 1) * limit;

        const statusParam = (parsedUrl.searchParams.get('status') || '').trim().toUpperCase();
        const searchParam = (parsedUrl.searchParams.get('search') || '').trim();

        const filterConditions: string[] = [];

        if (statusParam && statusParam !== 'ALL') {
          const cleanStatus = statusParam.replace(/[^A-Z_]/g, '');
          if (cleanStatus) {
            filterConditions.push(`l.status = '${cleanStatus}'`);
          }
        }

        if (searchParam) {
          const cleanSearch = searchParam.replace(/[^a-zA-Z0-9_\-\.]/g, '');
          if (cleanSearch) {
            filterConditions.push(`(
              p.user_id ILIKE '%${cleanSearch}%'
              OR p.client_id ILIKE '%${cleanSearch}%'
              OR l.oms_order_id::text ILIKE '%${cleanSearch}%'
              OR l.oms_leg_id::text ILIKE '%${cleanSearch}%'
              OR p.exchange_instrument_id::text ILIKE '%${cleanSearch}%'
            )`);
          }
        }

        const whereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';

        const sql = `
          WITH stats AS (
            SELECT json_build_object(
              'total', (SELECT count(*)::int FROM oms_legs),
              'armed', (SELECT count(*)::int FROM oms_legs WHERE status = 'ARMED'),
              'filled', (SELECT count(*)::int FROM oms_legs WHERE status = 'FILLED'),
              'cancelled', (SELECT count(*)::int FROM oms_legs WHERE status = 'CANCELLED'),
              'pending', (SELECT count(*)::int FROM oms_legs WHERE status = 'PENDING'),
              'exited', (SELECT count(*)::int FROM oms_legs WHERE status = 'EXITED'),
              'active_traders', (SELECT count(DISTINCT p.user_id)::int FROM oms_legs l JOIN oms_parents p ON p.oms_order_id = l.oms_order_id WHERE l.status = 'ARMED')
            ) AS s
          ),
          rows AS (
            SELECT 
              l.oms_leg_id AS "omsLegID",
              l.oms_order_id AS "omsOrderID",
              l.leg_role AS "legRole",
              l.status AS "status",
              l.side AS "entrySide",
              l.order_type AS "orderType",
              l.qty,
              l.filled_qty AS "filledQty",
              COALESCE(l.trigger_price, 0) AS "triggerPrice",
              COALESCE(l.stop_price, 0) AS "stopPrice",
              COALESCE(l.trail_points, 0) AS "trailPoints",
              COALESCE(l.peak_ltp, 0) AS "peakLTP",
              COALESCE(l.tp_points, 0) AS "tpPoints",
              COALESCE(l.limit_offset, 0) AS "limitOffset",
              p.exchange_segment AS "exchangeSegment",
              p.exchange_instrument_id AS "exchangeInstrumentID",
              l.armed_at AS "armedAt",
              l.created_at AS "createdAt",
              l.updated_at AS "updatedAt",
              p.user_id AS "userID",
              p.client_id AS "clientID",
              p.product_type AS "productType",
              p.order_unique_identifier AS "orderUniqueIdentifier",
              COALESCE(entry.symphony_app_order_id, l.symphony_app_order_id, 0) AS "entryAppOrderID",
              COUNT(*) OVER()::int AS "fullCount"
            FROM oms_legs l
            JOIN oms_parents p ON p.oms_order_id = l.oms_order_id
            LEFT JOIN oms_legs entry ON entry.oms_order_id = l.oms_order_id AND entry.leg_role = 'ENTRY'
            ${whereClause}
            ORDER BY l.created_at DESC, l.oms_leg_id DESC
            LIMIT ${limit} OFFSET ${offset}
          )
          SELECT json_build_object(
            'success', true,
            'data', COALESCE((SELECT json_agg(r) FROM rows r), '[]'::json),
            'stats', (SELECT s FROM stats)
          );
        `;

        exec(
          `PGPASSWORD=postgres psql -h localhost -U postgres -d oms -t -A -c "${sql.replace(/\s+/g, ' ').trim()}"`,
          (error, stdout) => {
            res.setHeader('Content-Type', 'application/json');
            if (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: error.message }));
              return;
            }
            try {
              const parsed = JSON.parse(stdout.trim() || '{"success":true,"data":[],"stats":{}}');
              const rows = Array.isArray(parsed.data)
                ? parsed.data.map((r: any) => ({
                    omsLegID: Number(r.omslegid ?? r.omsLegID ?? 0),
                    omsOrderID: Number(r.omsorderid ?? r.omsOrderID ?? 0),
                    legRole: String(r.legrole ?? r.legRole ?? 'ENTRY'),
                    status: String(r.status ?? 'PENDING'),
                    entrySide: String(r.entryside ?? r.entrySide ?? 'BUY'),
                    orderType: String(r.ordertype ?? r.orderType ?? 'MARKET'),
                    qty: Number(r.qty ?? 0),
                    filledQty: Number(r.filledqty ?? r.filledQty ?? 0),
                    triggerPrice: Number(r.triggerprice ?? r.triggerPrice ?? 0),
                    stopPrice: Number(r.stopprice ?? r.stopPrice ?? 0),
                    trailPoints: Number(r.trailpoints ?? r.trailPoints ?? 0),
                    peakLTP: Number(r.peakltp ?? r.peakLTP ?? 0),
                    tpPoints: Number(r.tppoints ?? r.tpPoints ?? 0),
                    limitOffset: Number(r.limitoffset ?? r.limitOffset ?? 0),
                    exchangeSegment: String(r.exchangesegment ?? r.exchangeSegment ?? 'NSEFO'),
                    exchangeInstrumentID: Number(r.exchangeinstrumentid ?? r.exchangeInstrumentID ?? 0),
                    armedAt: r.armedat ?? r.armedAt,
                    createdAt: String(r.createdat ?? r.createdAt ?? new Date().toISOString()),
                    updatedAt: String(r.updatedat ?? r.updatedAt ?? new Date().toISOString()),
                    userID: String(r.userid ?? r.userID ?? ''),
                    clientID: String(r.clientid ?? r.clientID ?? ''),
                    productType: String(r.producttype ?? r.productType ?? 'MIS'),
                    orderUniqueIdentifier: String(r.orderuniqueidentifier ?? r.orderUniqueIdentifier ?? ''),
                    entryAppOrderID: Number(r.entryapporderid ?? r.entryAppOrderID ?? 0),
                    fullCount: Number(r.fullcount ?? r.fullCount ?? 0),
                  }))
                : [];

              const totalRecords = rows.length > 0 ? (rows[0].fullCount || 0) : 0;
              const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  data: rows,
                  pagination: {
                    page,
                    limit,
                    totalRecords,
                    totalPages,
                  },
                  stats: parsed.stats || {
                    total: 0,
                    armed: 0,
                    filled: 0,
                    cancelled: 0,
                    pending: 0,
                    exited: 0,
                    active_traders: 0,
                  },
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          }
        );
        return;
      }

      // 2B. Single Trader Order Book View
      const userId = parsedUrl.searchParams.get('user_id') || '';
      const appOrderId = parsedUrl.searchParams.get('app_order_id') || '';

      const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!cleanUserId) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'user_id is required' }));
        return;
      }

      let extraFilter = '';
      if (appOrderId) {
        const cleanAppOrderId = appOrderId.replace(/[^a-zA-Z0-9_-]/g, '');
        if (cleanAppOrderId.startsWith('OMSLEG-')) {
          const legId = cleanAppOrderId.replace('OMSLEG-', '');
          if (/^\d+$/.test(legId)) {
            extraFilter = `AND l.oms_leg_id = ${legId}`;
          }
        } else if (/^\d+$/.test(cleanAppOrderId)) {
          extraFilter = `AND (entry.symphony_app_order_id = ${cleanAppOrderId} OR l.symphony_app_order_id = ${cleanAppOrderId} OR l.oms_order_id = ${cleanAppOrderId})`;
        }
      }

      const sql = `
        SELECT json_build_object(
          'success', true,
          'data', COALESCE(json_agg(r), '[]'::json)
        )
        FROM (
          SELECT 
            l.oms_leg_id AS "omsLegID",
            l.oms_order_id AS "omsOrderID",
            l.leg_role AS "legRole",
            l.status AS "status",
            l.side AS "entrySide",
            l.order_type AS "orderType",
            l.qty,
            l.filled_qty AS "filledQty",
            COALESCE(l.trigger_price, 0) AS "triggerPrice",
            COALESCE(l.stop_price, 0) AS "stopPrice",
            COALESCE(l.trail_points, 0) AS "trailPoints",
            COALESCE(l.peak_ltp, 0) AS "peakLTP",
            COALESCE(l.tp_points, 0) AS "tpPoints",
            COALESCE(l.limit_offset, 0) AS "limitOffset",
            p.exchange_segment AS "exchangeSegment",
            p.exchange_instrument_id AS "exchangeInstrumentID",
            l.armed_at AS "armedAt",
            l.created_at AS "createdAt",
            l.updated_at AS "updatedAt",
            p.user_id AS "userID",
            p.client_id AS "clientID",
            p.product_type AS "productType",
            p.order_unique_identifier AS "orderUniqueIdentifier",
            COALESCE(entry.symphony_app_order_id, l.symphony_app_order_id, 0) AS "entryAppOrderID"
          FROM oms_legs l
          JOIN oms_parents p ON p.oms_order_id = l.oms_order_id
          LEFT JOIN oms_legs entry ON entry.oms_order_id = l.oms_order_id AND entry.leg_role = 'ENTRY'
          WHERE p.user_id = '${cleanUserId}' ${extraFilter}
          ORDER BY l.created_at DESC, l.oms_order_id DESC
        ) r;
      `;

      exec(
        `PGPASSWORD=postgres psql -h localhost -U postgres -d oms -t -A -c "${sql.replace(/\s+/g, ' ').trim()}"`,
        (error, stdout) => {
          res.setHeader('Content-Type', 'application/json');
          if (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: error.message }));
            return;
          }
          try {
            const parsed = JSON.parse(stdout.trim() || '{"success":true,"data":[]}');
            if (Array.isArray(parsed.data)) {
              parsed.data = parsed.data.map((r: any) => ({
                omsLegID: Number(r.omslegid ?? r.omsLegID ?? 0),
                omsOrderID: Number(r.omsorderid ?? r.omsOrderID ?? 0),
                legRole: String(r.legrole ?? r.legRole ?? 'ENTRY'),
                status: String(r.status ?? 'PENDING'),
                entrySide: String(r.entryside ?? r.entrySide ?? 'BUY'),
                orderType: String(r.ordertype ?? r.orderType ?? 'MARKET'),
                qty: Number(r.qty ?? 0),
                filledQty: Number(r.filledqty ?? r.filledQty ?? 0),
                triggerPrice: Number(r.triggerprice ?? r.triggerPrice ?? 0),
                stopPrice: Number(r.stopprice ?? r.stopPrice ?? 0),
                trailPoints: Number(r.trailpoints ?? r.trailPoints ?? 0),
                peakLTP: Number(r.peakltp ?? r.peakLTP ?? 0),
                tpPoints: Number(r.tppoints ?? r.tpPoints ?? 0),
                limitOffset: Number(r.limitoffset ?? r.limitOffset ?? 0),
                exchangeSegment: String(r.exchangesegment ?? r.exchangeSegment ?? 'NSEFO'),
                exchangeInstrumentID: Number(r.exchangeinstrumentid ?? r.exchangeInstrumentID ?? 0),
                armedAt: r.armedat ?? r.armedAt,
                createdAt: String(r.createdat ?? r.createdAt ?? new Date().toISOString()),
                updatedAt: String(r.updatedat ?? r.updatedAt ?? new Date().toISOString()),
                userID: String(r.userid ?? r.userID ?? ''),
                clientID: String(r.clientid ?? r.clientID ?? ''),
                productType: String(r.producttype ?? r.productType ?? 'MIS'),
                orderUniqueIdentifier: String(r.orderuniqueidentifier ?? r.orderUniqueIdentifier ?? ''),
                entryAppOrderID: Number(r.entryapporderid ?? r.entryAppOrderID ?? 0),
              }));
            }
            res.statusCode = 200;
            res.end(JSON.stringify(parsed));
          } catch {
            res.statusCode = 200;
            res.end(stdout.trim() || '{"success":true,"data":[]}');
          }
        }
      );
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    backofficeApiPlugin(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8089',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
