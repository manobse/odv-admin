// All API calls go through this file.
// Vite proxies /api → http://localhost:5000 in dev.
// In production set VITE_API_BASE env var.

const BASE = import.meta.env.VITE_API_BASE || '/api'

export const getToken  = () => localStorage.getItem('sp_token') || ''
export const saveToken = t => t
  ? localStorage.setItem('sp_token', t)
  : localStorage.removeItem('sp_token')

async function req(method, path, body, params) {
  const url = new URL(BASE + path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const token = getToken()
  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!data.success) {
    if (res.status === 401) {
      saveToken('')
      // window.location.href = '/login'
    }
    throw new Error(data.message || `Request failed (${res.status})`)
  }
  return data
}

const api = {
  get:   (path, params) => req('GET',    path, undefined, params),
  post:  (path, body)   => req('POST',   path, body),
  put:   (path, body)   => req('PUT',    path, body),
  patch: (path, body)   => req('PATCH',  path, body),
  del:   (path)         => req('DELETE', path),
}

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  me:       ()                => api.get('/auth/me'),
  logout:   ()                => api.post('/auth/logout'),
  register: body              => api.post('/auth/register', body),
}

// ── Roles ─────────────────────────────────────────────────────────────────────
export const rolesApi = {
  list:   p      => api.get('/roles', p),
  create: body   => api.post('/roles', body),
  update: (id,b) => api.put(`/roles/${id}`, b),
  del:    id     => api.del(`/roles/${id}`),
}

// ── Sports ────────────────────────────────────────────────────────────────────
export const sportsApi = {
  list:   p      => api.get('/sports', p),
  create: body   => api.post('/sports', body),
  update: (id,b) => api.put(`/sports/${id}`, b),
  del:    id     => api.del(`/sports/${id}`),
}

// ── Courts ────────────────────────────────────────────────────────────────────
export const courtsApi = {
  list:   p      => api.get('/courts', p),
  create: body   => api.post('/courts', body),
  update: (id,b) => api.put(`/courts/${id}`, b),
  del:    id     => api.del(`/courts/${id}`),
}

// ── Taxes ─────────────────────────────────────────────────────────────────────
export const taxesApi = {
  list:   p      => api.get('/taxes', p),
  create: body   => api.post('/taxes', body),
  update: (id,b) => api.put(`/taxes/${id}`, b),
  del:    id     => api.del(`/taxes/${id}`),
}

// ── Charges ───────────────────────────────────────────────────────────────────
export const chargesApi = {
  list:   p      => api.get('/charges', p),
  create: body   => api.post('/charges', body),
  update: (id,b) => api.put(`/charges/${id}`, b),
  del:    id     => api.del(`/charges/${id}`),
}

// ── Players ───────────────────────────────────────────────────────────────────
export const playersApi = {
  list:     p      => api.get('/players', p),
  bookings: id     => api.get(`/players/${id}/bookings`),
  create:   body   => api.post('/players', body),
  update:   (id,b) => api.put(`/players/${id}`, b),
  del:      id     => api.del(`/players/${id}`),
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsApi = {
  list:   p      => api.get('/bookings', p),
  get:    id     => api.get(`/bookings/${id}`),
  create: body   => api.post('/bookings', body),
  update: (id,b) => api.put(`/bookings/${id}`, b),
  cancel: id     => api.del(`/bookings/${id}`),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list:   p      => api.get('/categories', p),
  create: body   => api.post('/categories', body),
  update: (id,b) => api.put(`/categories/${id}`, b),
  del:    id     => api.del(`/categories/${id}`),
}

// ── Income ────────────────────────────────────────────────────────────────────
export const incomeApi = {
  list:   p      => api.get('/income', p),
  create: body   => api.post('/income', body),
  update: (id,b) => api.put(`/income/${id}`, b),
  del:    id     => api.del(`/income/${id}`),
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expensesApi = {
  list:   p      => api.get('/expenses', p),
  create: body   => api.post('/expenses', body),
  update: (id,b) => api.put(`/expenses/${id}`, b),
  del:    id     => api.del(`/expenses/${id}`),
}

// ── Staff ─────────────────────────────────────────────────────────────────────
export const staffApi = {
  list:   p      => api.get('/staff', p),
  create: body   => api.post('/staff', body),
  update: (id,b) => api.put(`/staff/${id}`, b),
  toggle: id     => api.patch(`/staff/${id}/toggle`),
  del:    id     => api.del(`/staff/${id}`),
}

// ── Payroll ───────────────────────────────────────────────────────────────────
export const payrollApi = {
  list:    p      => api.get('/payroll', p),
  create:  body   => api.post('/payroll', body),
  bulkGen: body   => api.post('/payroll/bulk-generate', body),
  update:  (id,b) => api.put(`/payroll/${id}`, b),
  pay:     id     => api.put(`/payroll/${id}/pay`),
  payslip: id     => api.get(`/payroll/${id}/payslip`),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard: p => api.get('/reports/dashboard', p),
  financial: p => api.get('/reports/financial',  p),
  monthly:   p => api.get('/reports/monthly',    p),
  sports:    p => api.get('/reports/sports',      p),
  courts:    p => api.get('/reports/courts',      p),
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export const auditApi = {
  list: p => api.get('/audit', p),
}
