import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../helpers'
import { incomeApi, expensesApi, categoriesApi } from '../api/client'
import { Btn, Badge, Tbl, Modal, FG, FRow, Spinner, PageHeader, StatCard, Tabs } from '../components/ui'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const today = () => new Date().toISOString().slice(0, 10)
const thisMonth = () => new Date().toISOString().slice(0, 7)

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer']

/* ══════════════════════════════ INCOME ════════════════════════════════════ */
export function Income() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => incomeApi.list({ limit: 100 }))
  const { data: cD } = useAsync(() => categoriesApi.list({ type: 'income', limit: 50 }))
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ date: today(), category: '', amount: '1000', description: '', paymentMode: 'UPI' })
  const [saving, setSaving] = useState(false)
  const cats = cD?.data || []
  const rows = data?.data || []
  const monthTotal = rows.filter(r => r.date?.startsWith(thisMonth())).reduce((a, b) => a + b.amount, 0)
  const p = f => setForm(prev => ({ ...prev, ...f }))

  function resetForm() {
    setForm({
      date: today(),
      category: cats[0]?._id || '',
      amount: '',
      description: '',
      paymentMode: 'UPI',
    });
  }

  async function save() {
    if (!form.amount || !form.description || !form.category) { toast('Fill all fields', 'error'); return }
    setSaving(true)
    try {
      await incomeApi.create({ ...form, amount: +form.amount })
      toast('Income added', 'success'); reload(); setModal(false)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this income entry?')) return
    try { await incomeApi.del(id); toast('Deleted', 'success'); reload() }
    catch (e) { toast(e.message, 'error') }
  }

  const cols = [
    { key: 'date', label: 'Date', render: r => <span style={{ fontSize: 13, color: 'var(--text3)' }}>{formatDate(r.date)}</span> },
    { key: 'category', label: 'Category', render: r => <Badge variant="green">{r.category?.name || '—'}</Badge> },
    { key: 'description', label: 'Description', render: r => <span style={{ fontSize: 13 }}>{r.description}</span> },
    { key: 'reference', label: 'Ref', render: r => <code style={{ fontSize: 12, color: 'var(--accent)' }}>{r.reference || '—'}</code> },
    { key: 'amount', label: 'Amount', render: r => <strong style={{ color: 'var(--green)' }}>{fmt(r.amount)}</strong> },
    {
      key: 'paymentMode', label: 'Payment Mode', render: r => {
        const colors = { Cash: 'blue', UPI: 'teal', Card: 'accent', 'Bank Transfer': 'amber' }
        return r.paymentMode
          ? <Badge variant={colors[r.paymentMode] || 'default'}>{r.paymentMode}</Badge>
          : <span style={{ color: 'var(--text3)' }}>—</span>
      },
    },
    { key: 'del', label: '', render: r => <Btn variant="danger" size="xs" onClick={() => del(r._id)} style={{ padding: '4px 8px' }}>🗑</Btn> },
  ]

  return (
    <div>
      <PageHeader title="Income" sub="All revenue entries"
        action={<Btn size="sm" onClick={() => { resetForm(); setModal(true) }}>＋ Add Income</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14, marginBottom: 18 }}>
        <StatCard label="Total Income" value={fmt(data?.totalAmount || 0)} color="var(--green)" />
        <StatCard label="This Month" value={fmt(monthTotal)} color="var(--teal)" />
        <StatCard label="Total Entries" value={data?.total || 0} />
      </div>
      <Tbl cols={cols} rows={rows} loading={loading} empty="No income entries yet" />

      {modal && (
        <Modal title="Add Income Entry" onClose={() => setModal(false)}
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(false)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Save</Btn></>}>
          <FRow>
            <FG label="Date"><input type="date" value={form.date} onChange={e => p({ date: e.target.value })} /></FG>
            <FG label="Category">
              <select value={form.category} onChange={e => p({ category: e.target.value })}>
                <option value="">Select…</option>
                {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </FG>
          </FRow>
          <FRow>
            <FG label="Amount (₹)"><input type="number" value={form.amount} onChange={e => p({ amount: e.target.value })} min="0" placeholder="0" autoFocus /></FG>
            <FG label="Mode of Payment *">
              <select value={form.paymentMode} onChange={e => p({ paymentMode: e.target.value })}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FG>
          </FRow>
          <FG label="Description">
            <textarea
              value={form.description}
              onChange={e => p({ description: e.target.value })}
              placeholder="Description of income"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </FG>
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════ EXPENSES ══════════════════════════════════ */
export function Expenses() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => expensesApi.list({ limit: 100 }))
  const { data: cD } = useAsync(() => categoriesApi.list({ type: 'expense', limit: 50 }))
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ date: today(), category: '', amount: '', description: '', paymentMode: 'UPI' })
  const [saving, setSaving] = useState(false)
  const cats = cD?.data || []
  const rows = data?.data || []
  const monthTotal = rows.filter(r => r.date?.startsWith(thisMonth())).reduce((a, b) => a + b.amount, 0)
  const p = f => setForm(prev => ({ ...prev, ...f }))

  function resetForm() {
    setForm({
      date: today(),
      category: cats[0]?._id || '',
      amount: '',
      description: '',
      paymentMode: 'UPI',
    });
  }

  async function save() {
    if (!form.amount || !form.description || !form.category) { toast('Fill all fields', 'error'); return }
    setSaving(true)
    try {
      await expensesApi.create({ ...form, amount: +form.amount })
      toast('Expense added', 'success'); reload(); setModal(false)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this expense entry?')) return
    try { await expensesApi.del(id); toast('Deleted', 'success'); reload() }
    catch (e) { toast(e.message, 'error') }
  }

  const cols = [
    { key: 'date', label: 'Date', render: r => <span style={{ fontSize: 13, color: 'var(--text3)' }}>{formatDate(r.date)}</span> },
    { key: 'category', label: 'Category', render: r => <Badge variant="red">{r.category?.name || '—'}</Badge> },
    { key: 'description', label: 'Description', render: r => <span style={{ fontSize: 13 }}>{r.description}</span> },
    { key: 'reference', label: 'Ref', render: r => <code style={{ fontSize: 12, color: 'var(--text3)' }}>{r.reference || '—'}</code> },
    { key: 'amount', label: 'Amount', render: r => <strong style={{ color: 'var(--red)' }}>{fmt(r.amount)}</strong> },
    {
      key: 'paymentMode', label: 'Payment Mode', render: r => {
        const colors = { Cash: 'blue', UPI: 'teal', Card: 'accent', 'Bank Transfer': 'amber' }
        return r.paymentMode
          ? <Badge variant={colors[r.paymentMode] || 'default'}>{r.paymentMode}</Badge>
          : <span style={{ color: 'var(--text3)' }}>—</span>
      },
    },
    { key: 'del', label: '', render: r => <Btn variant="danger" size="xs" onClick={() => del(r._id)} style={{ padding: '4px 8px' }}>🗑</Btn> },
  ]

  return (
    <div>
      <PageHeader title="Expenses" sub="Daily expense tracking"
        action={<Btn size="sm" onClick={() => { resetForm(); setModal(true) }}>＋ Add Expense</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14, marginBottom: 18 }}>
        <StatCard label="Total Expenses" value={fmt(data?.totalAmount || 0)} color="var(--red)" />
        <StatCard label="This Month" value={fmt(monthTotal)} color="var(--amber)" />
        <StatCard label="Total Entries" value={data?.total || 0} />
      </div>
      <Tbl cols={cols} rows={rows} loading={loading} empty="No expense entries yet" />

      {modal && (
        <Modal title="Add Expense Entry" onClose={() => setModal(false)}
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(false)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Save</Btn></>}>
          <FRow>
            <FG label="Date"><input type="date" value={form.date} onChange={e => p({ date: e.target.value })} /></FG>
            <FG label="Category">
              <select value={form.category} onChange={e => p({ category: e.target.value })}>
                <option value="">Select…</option>
                {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </FG>
          </FRow>
          <FRow>
            <FG label="Amount (₹)"><input type="number" value={form.amount} onChange={e => p({ amount: e.target.value })} min="0" placeholder="0" autoFocus /></FG>
            <FG label="Mode of Payment *">
              <select value={form.paymentMode} onChange={e => p({ paymentMode: e.target.value })}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FG>
          </FRow>
          <FG label="Description">
            <textarea
              value={form.description}
              onChange={e => p({ description: e.target.value })}
              placeholder="What was this expense for?"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </FG>
        </Modal>
      )}
    </div>
  )
}

/* ═════════════════════════════ CATEGORIES ═════════════════════════════════ */
export function Categories() {
  const toast = useToast()
  const [tab, setTab] = useState('income')
  const { data, loading, reload } = useAsync(() => categoriesApi.list({ type: tab, limit: 50 }), [tab])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '' })
  const [saving, setSaving] = useState(false)
  const rows = data?.data || []

  async function save() {
    if (!form.name) { toast('Name required', 'error'); return }
    setSaving(true)
    try {
      if (modal === 'add') await categoriesApi.create({ name: form.name, type: tab })
      else await categoriesApi.update(form._id, { name: form.name })
      toast('Saved', 'success'); reload(); setModal(null)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this category?')) return
    try { await categoriesApi.del(id); toast('Deleted', 'success'); reload() }
    catch (e) { toast(e.message, 'error') }
  }

  return (
    <div>
      <PageHeader title="Categories" sub="Manage income & expense categories"
        action={<Btn size="sm" onClick={() => { setForm({ name: '' }); setModal('add') }}>＋ Add</Btn>}
      />
      <Tabs
        tabs={[{ key: 'income', label: '📈 Income Categories' }, { key: 'expense', label: '📉 Expense Categories' }]}
        active={tab} onChange={setTab}
      />
      {loading ? <Spinner center /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
          {rows.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 14, padding: '20px 0' }}>No {tab} categories yet. Add one!</p>}
          {rows.map(c => (
            <div key={c._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{tab} category</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant="ghost" size="xs" onClick={() => { setForm({ ...c }); setModal('edit') }} style={{ padding: '5px 8px' }}>✏</Btn>
                <Btn variant="danger" size="xs" onClick={() => del(c._id)} style={{ padding: '5px 8px' }}>🗑</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={`${modal === 'add' ? 'Add' : 'Edit'} ${tab} Category`} onClose={() => setModal(null)}
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Save</Btn></>}>
          <FG label="Category Name">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coaching, Maintenance…" autoFocus />
          </FG>
        </Modal>
      )}
    </div>
  )
}
