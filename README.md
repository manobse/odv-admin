# SportsPlex Admin — React Frontend

Production-grade React + Vite admin portal, fully connected to the SportsPlex Node.js/Express/MongoDB backend.

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Backend running on port 5000 (see `sportsplex-backend/`)

### Install & run

```bash
cd sportsplex-react
npm install
npm run dev          # → http://localhost:3000
```

Vite proxies all `/api` calls to `http://localhost:5000` — no CORS configuration needed in development.

### Build for production

```bash
npm run build        # outputs to dist/
```

Set `VITE_API_BASE` env var if your API lives at a different URL in production:
```
VITE_API_BASE=https://api.yourdomain.com/api
```

---

## Start order

```bash
# 1. Seed + start backend
cd sportsplex-backend
npm install
npm run seed         # creates demo data + users
npm run dev          # → http://localhost:5000

# 2. Start frontend (new terminal)
cd sportsplex-react
npm install
npm run dev          # → http://localhost:3000
```

---

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@sportsplex.in    | admin123 | Super Admin (all permissions) |
| manager@sportsplex.in  | admin123 | Manager |
| staff@sportsplex.in    | admin123 | Staff (bookings + income only) |

---

## Project Structure

```
sportsplex-react/
├── index.html
├── vite.config.js            ← proxy /api → localhost:5000
├── package.json
└── src/
    ├── index.css              ← CSS tokens (dark/light), global reset, compat aliases
    ├── main.jsx               ← Router, AuthProvider, ToastProvider, route guard
    │
    ├── api/
    │   └── client.js          ← fetch wrapper + all API domain helpers
    │
    ├── context/
    │   ├── AuthContext.jsx    ← login / logout / hasPerm / user state
    │   └── ToastContext.jsx   ← toast(msg, type) notification system
    │
    ├── hooks/
    │   └── useAsync.js        ← useAsync(fn, deps) → { data, loading, error, reload }
    │
    ├── components/
    │   ├── ui.jsx             ← ALL shared components (Btn, Badge, Modal, Tbl, etc.)
    │   └── Layout.jsx         ← Sidebar + Topbar shell, dark/light toggle
    │
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx      ← KPIs, revenue bar chart, sport breakdown
        ├── SportManagement.jsx ← Sports, Courts, Taxes, Charges (4 pages in one)
        ├── BookingPlayers.jsx  ← Players, Bookings + invoice modal
        ├── Finance.jsx         ← Income, Expenses, Categories (3 pages in one)
        ├── HR.jsx              ← Staff cards, Payroll, payslip modal
        ├── Reports.jsx         ← Bar/pie charts, P&L, court utilization
        ├── Audit.jsx           ← Searchable read-only activity log
        ├── Roles.jsx           ← Dynamic role + permission grid
        └── *.jsx               ← Barrel re-exports (Sports.jsx → SportManagement.Sports)
```

---

## Pages & Routes

| Route | Page | Key Features |
|-------|------|-------------|
| `/` | Dashboard | Live KPI cards, Recharts bar chart, sport revenue, recent bookings |
| `/sports` | Sports | Card grid, emoji+color picker, active toggle |
| `/courts` | Courts | Table with sport filter, inline activate/deactivate |
| `/charges` | Charges | Tax-inclusive price preview, sport filter |
| `/taxes` | Taxes | GST slab CRUD |
| `/players` | Players | Search, add/edit, sport assignment |
| `/bookings` | Bookings | Full booking wizard → auto-records income → invoice print |
| `/income` | Income | Manual entries, auto-entries from bookings, category breakdown |
| `/expenses` | Expenses | Daily tracking, category filter |
| `/categories` | Categories | Tabbed income/expense category CRUD |
| `/staff` | Staff | Rich staff cards with salary info, activate/deactivate |
| `/payroll` | Payroll | Mark paid (auto-creates expense), bulk generate, payslip PDF |
| `/reports` | Reports | Financial pie charts, monthly trend, sport revenue, court utilization, P&L |
| `/audit` | Audit Logs | Search + module/type filters, read-only |
| `/roles` | Roles | Create roles, checkbox permission grid, select/deselect all |

---

## Key Architecture Patterns

### API Client (`src/api/client.js`)
- Single `req()` function handles all HTTP methods
- Reads JWT from `localStorage`, injects as `Authorization: Bearer` header
- Throws named errors on non-success responses
- Auto-redirects to `/login` on 401
- `VITE_API_BASE` env override for production deployment

### Auth (`src/context/AuthContext.jsx`)
- Restores session on mount via `GET /api/auth/me`
- `hasPerm(key)` checks role permissions for UI gating
- JWT stored in `localStorage` under key `sp_token`

### Data Fetching (`src/hooks/useAsync.js`)
- Simple `useAsync(fn, deps)` hook
- Returns `{ data, loading, error, reload }`
- Re-runs when `deps` change (like search/filter state)
- Cleans up on unmount via `alive` ref

### Toasts (`src/context/ToastContext.jsx`)
- `toast(msg, type)` — types: `success`, `error`, `info`, `warning`
- Auto-dismisses after 3.5s
- Stacks multiple toasts

### Theming
- CSS custom properties (variables) for all colours
- Dark mode is default; light mode toggled via topbar button
- Preference saved to `localStorage` under `sp_theme`
- Full alias set in `index.css` for backward compatibility

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Recharts | Charts (bar, pie) on dashboard + reports |
| Vite | Build tool, dev server, API proxy |

Zero external UI component libraries — all components built from scratch in `src/components/ui.jsx`.
