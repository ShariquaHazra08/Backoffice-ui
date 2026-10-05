# FirstDemat Backoffice OMS Orders Portal

A standalone internal dashboard for backoffice, operations, and RMS teams to inspect trader order history and intervene on a user's behalf (cancel legs, cancel unfilled orders, or force exit/square-off filled positions).

---

## 🚀 Quick Start

From this directory:

```bash
# 1. Install dependencies (already installed)
npm install

# 2a. Development (HMR) — do NOT use for Lighthouse
npm run dev

# 2b. Production serve on :3000 — use this for Lighthouse / real performance
npm start
```

The portal will be live at: **`http://localhost:3000`**

> **Lighthouse tip:** `npm run dev` injects React Refresh and scores ~30–40. Always run `npm start` (optimized build) before auditing performance.
---

## 🔌 API Integration Details

This UI communicates **100% with the existing OMS backend APIs** without modifying the Go backend:

| Action | HTTP Endpoint | Existing Backend Handler |
| :--- | :--- | :--- |
| **Fetch Protectives & Legs** | `GET /api/v1/oms/orders/protectives?user_id={id}` | `HandleListProtectives` |
| **Cancel Protective Leg (SL/TP)**| `POST /api/v1/oms/orders/smart-intraday/cancel-protective` | `HandleCancelProtectiveLeg` |
| **Cancel Unfilled Entry Order** | `POST /api/v1/oms/orders/smart-intraday/cancel` | `HandleCancelSmartIntraday` |
| **Force Exit / Square-Off** | `POST /api/v1/oms/orders/smart-intraday/exit` | `HandleExitSmartIntraday` |

### Configuration

You can configure the backend target directly in the UI via the **"Connection"** button in the top navbar:
- **Default proxy:** `/api/v1/oms` (proxied to `http://localhost:8089`)
- **Direct backend URL:** `http://localhost:8089/api/v1/oms` (or `http://localhost:8080/api/v1/oms`)
- **Internal API Key:** Matches `X-Internal-Key` (`OMS_INTERNAL_API_KEY`) if configured on the server.

---

## 🛠 Features

1. **User Order Lookup:**
   - Look up orders by **User ID** (e.g. `u_982143`).
   - Optional filter by **App Order ID** (`12001261400...` or `OMSLEG-8820...`).
2. **Order & Legs Breakdown:**
   - Shows Parent OMS Order ID grouped with all child legs (`ENTRY`, `SL`, `TARGET`).
   - Displays real-time status pills (`ARMED`, `FILLED`, `PLACED`, `FIRING`, `CANCELLED`).
   - Inspects entry side (BUY/SELL), quantities, trigger/stop prices, slippage limit offsets, trailing SL points, and peak LTP.
3. **Admin Intervention Controls:**
   - **Cancel Leg:** Disarms the Stop-Loss or Target trigger from Redis and updates Postgres to `CANCELLED`.
   - **Cancel Entry:** Cancels the unfilled entry order with the Symphony broker and cancels the parent.
   - **Force Exit Position:** Executes an immediate market square-off order with Symphony to close open positions on the user's behalf.
4. **Safety Confirmation Modals:**
   - All destructive actions require confirmation and prompt for a backoffice reason for audit tracking.
