# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React + Vite admin portal for SportsPlex, talking to a separate Node/Express/MongoDB backend (not in this repo) that runs on port 5000. All routes are behind auth; there is no public-facing marketing site here.

## Commands

```bash
npm run dev       # start dev server on http://localhost:3000 (proxies /api -> http://localhost:5000)
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

There is no lint script, no test runner, and no TypeScript configured in this repo — don't assume `npm test` or `npm run lint` exist. When verifying a change, run `npm run build` and/or `npm run dev` and check the browser.

Backend must be running separately (`sportsplex-backend`, port 5000) for the app to function; without it, API calls will fail.

## Architecture

- **Routing**: single `BrowserRouter` in `src/main.jsx` with a flat route list (no nested/lazy routes). A `Guard` component wraps everything except `/login`, redirecting to `/login` when `AuthContext`'s `user` is null.
- **Auth**: `src/context/AuthContext.jsx`. JWT stored in `localStorage` under `sp_token` (via `saveToken`/`getToken` in `src/api/client.js`). Session restored on mount via `GET /api/auth/me`. Exposes `{ user, loading, login, logout, hasPerm }` — `hasPerm(key)` checks `user.role.permissions`.
- **API layer**: everything goes through `src/api/client.js`. One `req(method, path, body, params)` helper does the fetch, attaches the `Authorization: Bearer` header, and throws `new Error(data.message)` when `data.success` is falsy (the backend wraps all responses in `{ success, data, message }`). On a 401 it clears the token. Domain calls are grouped into per-resource objects at the bottom of the file (`sportsApi`, `bookingsApi`, `payrollApi`, etc.) — add new endpoints there rather than calling `fetch`/`api.get` directly from a page.
- **Data fetching**: `src/hooks/useAsync.js` — `useAsync(fn, deps)` returns `{ data, loading, error, reload }` and re-runs when `deps` changes. This is the standard way pages load list/detail data; there is no React Query/SWR/Redux/Zustand in this project.
- **Server-side pagination**: for endpoints that support `?page=&limit=` (backed by the API's `applyPagination`/`crudFactory` helpers), pages keep `page`/`limit` state (default `1`/`50`) alongside any existing `search`/filter state, pass them into the `useAsync` fetcher's params and `deps` array, and read pagination metadata off `data.pagination` (`{ page, limit, totalRecords, totalPages, hasNextPage, hasPreviousPage }` — only returned when both `page` and `limit` are sent). Changing `search`, a filter, or the page size resets `page` back to `1` (set both state values in the same handler so React batches them into a single request). Render the shared `Pagination` component from `ui.jsx` below the `Tbl`, passing the metadata through plus `onPageChange`/`onLimitChange` setters — see `src/pages/BookingPlayers.jsx`'s `Players` component for the reference implementation.
- **Toasts**: `src/context/ToastContext.jsx` provides `toast(msg, type)` (`success | error | info | warning`), auto-dismiss after 3.5s. Used for both success confirmations and surfacing caught API errors (`catch (e) { toast(e.message, 'error') }`).
- **Error handling convention**: no error boundaries, no global error state. Async actions use local `try/catch` around the API call, show a toast and/or set a local `error` string rendered via `<ErrMsg msg={error} />`; `useAsync`'s `error` field is rendered the same way. There is no retry/backoff logic — keep new code consistent with this simple pattern rather than introducing a new error-handling layer.
- **Shared components**: `src/components/ui.jsx` is the single source for every reusable UI primitive (`Btn`, `Badge`, `Card`, `StatCard`, `Spinner`, `Modal`, `FG`/`FRow` form helpers, `Toggle`, `Tbl`, `Pagination`, `PageHeader`, `Tabs`, `InfoBox`, `ErrMsg`, `Avatar`, `ProgressBar`). There are zero external UI/component libraries — do not add one (e.g. MUI, Ant, shadcn); extend `ui.jsx` instead. `src/components/Layout.jsx` is the sidebar/topbar shell (nav config, dark/light toggle, logout) wrapped around every authenticated route.
- **Forms**: plain controlled inputs + `useState` object + a `p = f => setForm(prev => ({ ...prev, ...f }))` patch helper — no form library (no Formik/RHF/Zod). Create/edit is typically one `form` state object reused for both add and edit modes, submitted through a `Modal` with `FG`/`FRow` for layout, and a local `saving` boolean driving the submit button's `loading` prop.
- **Styling**: no CSS framework, no CSS modules, no styled-components. Every component uses inline `style={{ ... }}` objects referencing CSS custom properties defined in `src/index.css` (`--bg`, `--surf`, `--tx`, `--ac`, `--brd`, `--r`, `--ffH`, etc.). `index.css` also defines legacy alias variable names (`--surface`, `--text`, `--accent`, …) kept for backward compatibility — prefer the short token names (`--surf`, `--tx`, `--ac`) in new code. Dark mode is the default; `.light` class on `<body>` overrides the tokens. Theme preference persists to `localStorage` under `sp_theme`.
- **Pages** (`src/pages/`): most routes map 1:1 to a page file, but several related resources are grouped into one implementation file with multiple named exports, re-exported through thin barrel files for routing/import convenience — e.g. `SportManagement.jsx` exports `Sports`, `Courts`, `Charges`, `Taxes`, each re-exported as default from `Sports.jsx`, `Courts.jsx`, etc. Same pattern for `Finance.jsx` (Income/Expenses/Categories), `BookingPlayers.jsx` (Players/Bookings), and `MyProfileView.jsx` → `MyProfile.jsx`. When adding a feature to one of these resources, check whether it belongs in the grouped file rather than creating a new page.
- **Charts**: Recharts is the only charting library (bar/pie charts on Dashboard and Reports).
- **Build config**: `vite.config.js` sets the dev server to port 3000 and proxies `/api` to `http://localhost:5000`. Production API base is overridden via the `VITE_API_BASE` env var (read in `src/api/client.js`); when unset it defaults to `/api`. `vercel.json` rewrites all paths to `/` for SPA client-side routing on Vercel deploys.
- **Helpers**: `src/helpers/index.js` holds small formatting utilities (`calculateAge`, `formatDate`, `formatDateTime`) — check here before writing a new date/formatting helper.
