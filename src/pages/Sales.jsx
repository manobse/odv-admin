import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatDateTime } from '../helpers'
import { salesApi, chargesApi, playersApi, sportsApi } from '../api/client'
import { Btn, Badge, Tbl, Modal, FG, FRow, PageHeader, InfoBox, Pagination, ErrMsg, SearchableSelect } from '../components/ui'
import { ChargeTypeBadge } from '../components/ChargeType'
import { SELLABLE_CHARGE_TYPES, CHARGE_TYPE_LABEL } from '../constants/chargeTypes'
import { PAYMENT_MODES, PAYMENT_MODE_COLOR } from '../constants/paymentModes'
import logoImg from '../assets/logo.png'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')

const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial']
const SALE_STATUSES    = ['Completed', 'Cancelled']

const PAY_STATUS_COLOR  = { Paid: 'green', Pending: 'amber', Partial: 'blue' }
const SALE_STATUS_COLOR = { Completed: 'green', Cancelled: 'red' }

const QTY_BTN = {
  width: 26, height: 26, borderRadius: 6, border: '1px solid var(--brd2)',
  background: 'var(--surf)', color: 'var(--tx2)', fontSize: 14, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0,
}

function SaleStatusBadge({ status }) {
  return <Badge variant={SALE_STATUS_COLOR[status] || 'default'}>{status}</Badge>
}

const emptyItem      = () => ({ chargeId: '', quantity: '1' })
const emptySaleForm  = () => ({
  customerType: 'player', player: '', customerName: '', sport: '',
  items: [emptyItem()],
  discountAmount: '0', paymentMode: 'UPI', paymentStatus: 'Paid', notes: '',
})
const emptyFilters = { playerId: '', sportId: '', paymentMode: '', paymentStatus: '', status: '', startDate: '', endDate: '' }

export default function Sales() {
  const toast = useToast()
  const { hasPerm } = useAuth()
  const canManage = hasPerm('sales')
  const [searchParams, setSearchParams] = useSearchParams()

  const [search,  setSearch]  = useState(searchParams.get('search') || '')
  const [page,    setPage]    = useState(1)
  const [limit,   setLimit]   = useState(50)
  const [filters, setFilters] = useState(emptyFilters)

  // Consume a one-off "?search=SAL-xxxxx" deep link (e.g. from the Income list) without
  // permanently pinning it into the URL as the user keeps searching/filtering afterwards.
  useEffect(() => {
    if (searchParams.get('search')) setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data, loading, error, reload } = useAsync(
    () => salesApi.list({
      page, limit,
      ...(search ? { search } : {}),
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    }),
    [page, limit, search, filters.playerId, filters.sportId, filters.paymentMode, filters.paymentStatus, filters.status, filters.startDate, filters.endDate]
  )
  const { data: pD }  = useAsync(() => playersApi.list({ limit: 200 }))
  const { data: sD }  = useAsync(() => sportsApi.list({ limit: 50 }))
  const { data: chD } = useAsync(
    () => Promise.all(SELLABLE_CHARGE_TYPES.map(t => chargesApi.list({ chargeType: t, active: true, limit: 100 })))
      .then(results => ({ data: results.flatMap(r => r.data) })),
    []
  )

  const players     = useMemo(() => (pD?.data || []).slice().sort((a, b) => a.name.localeCompare(b.name)), [pD])
  const sports      = sD?.data || []
  const saleCharges = chD?.data || []
  const rows        = data?.data || []
  const pg          = data?.pagination

  const [modal,          setModal]          = useState(null) // 'add' | 'edit'
  const [form,           setForm]           = useState(emptySaleForm())
  const [saving,         setSaving]         = useState(false)
  const [detail,         setDetail]         = useState(null) // sale row shown in detail modal
  const [invoiceData,    setInvoiceData]    = useState(null) // { sale, club }
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [cancelTarget,   setCancelTarget]   = useState(null)
  const [cancelling,     setCancelling]     = useState(false)

  function changeSearch(v) { setSearch(v); setPage(1) }
  function changeFilter(f) { setFilters(prev => ({ ...prev, ...f })); setPage(1) }
  function changeLimit(l)  { setLimit(l); setPage(1) }
  function clearFilters()  { setFilters(emptyFilters); setSearch(''); setPage(1) }
  const hasActiveFilters = !!(search || Object.values(filters).some(Boolean))

  const p = f => setForm(prev => ({ ...prev, ...f }))

  function openAdd() { setForm(emptySaleForm()); setModal('add') }

  function openEdit(sale) {
    setForm({
      _id: sale._id,
      saleNumber: sale.saleNumber,
      customerType: sale.player ? 'player' : 'guest',
      player: sale.player?._id || '',
      customerName: sale.customerName || '',
      sport: sale.sport?._id || '',
      items: sale.items.map(i => ({ chargeId: i.charge?._id || i.charge, quantity: String(i.quantity) })),
      discountAmount: String(sale.discountAmount || 0),
      paymentMode: sale.paymentMode,
      paymentStatus: sale.paymentStatus,
      notes: sale.notes || '',
    })
    setDetail(null)
    setModal('edit')
  }

  // ── Item / pricing helpers (preview only — backend recomputes authoritatively) ──
  function itemCalc(item) {
    const charge = saleCharges.find(c => c._id === item.chargeId)
    const qty = Math.max(1, parseInt(item.quantity) || 1)
    if (!charge) return { charge: null, qty, unit: 0, taxRate: 0, subtotal: 0, taxAmount: 0, total: 0 }
    const unit = charge.base || 0
    const taxRate = charge.tax?.rate || 0
    const subtotal = unit * qty
    const taxAmount = subtotal * taxRate / 100
    return { charge, qty, unit, taxRate, subtotal, taxAmount, total: subtotal + taxAmount }
  }
  const itemCalcs      = form.items.map(itemCalc)
  const subtotal       = itemCalcs.reduce((s, i) => s + i.subtotal, 0)
  const taxTotal        = itemCalcs.reduce((s, i) => s + i.taxAmount, 0)
  const maxDiscount     = subtotal + taxTotal
  const discountAmount  = Math.min(Math.max(+form.discountAmount || 0, 0), maxDiscount)
  const grandTotal      = subtotal + taxTotal - discountAmount

  function selectItemCharge(idx, chargeId) {
    setForm(prev => {
      const items = [...prev.items]
      const dupIdx = items.findIndex((it, i) => i !== idx && it.chargeId === chargeId)
      if (chargeId && dupIdx > -1) {
        const mergedQty = (parseInt(items[dupIdx].quantity) || 1) + (parseInt(items[idx].quantity) || 1)
        items[dupIdx] = { ...items[dupIdx], quantity: String(mergedQty) }
        items.splice(idx, 1)
        toast('Charge already added — quantity increased instead', 'info')
      } else {
        items[idx] = { ...items[idx], chargeId }
      }
      return { ...prev, items }
    })
  }
  function updateItemQty(idx, qty) {
    setForm(prev => {
      const items = [...prev.items]
      items[idx] = { ...items[idx], quantity: qty }
      return { ...prev, items }
    })
  }
  function addItem() { setForm(prev => ({ ...prev, items: [...prev.items, emptyItem()] })) }
  function removeItem(idx) {
    setForm(prev => prev.items.length <= 1 ? prev : ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  }

  function validate() {
    if (form.customerType === 'player' && !form.player) return 'Select a registered player'
    if (form.customerType === 'guest' && !form.customerName.trim()) return 'Enter a customer name for the walk-in sale'
    for (const it of form.items) {
      if (!it.chargeId) return 'Select a charge for every item'
      const q = parseInt(it.quantity)
      if (!Number.isInteger(q) || q <= 0) return 'Quantity must be a positive whole number'
    }
    return null
  }

  async function save() {
    const err = validate()
    if (err) { toast(err, 'error'); return }
    setSaving(true)
    try {
      const body = {
        player: form.customerType === 'player' ? form.player : '',
        customerName: form.customerType === 'player' ? '' : form.customerName.trim(),
        sport: form.sport,
        items: form.items.map(it => ({ chargeId: it.chargeId, quantity: parseInt(it.quantity) || 1 })),
        discountAmount,
        paymentMode: form.paymentMode,
        paymentStatus: form.paymentStatus,
        notes: form.notes,
      }
      const isAdd = modal === 'add'
      const r = isAdd ? await salesApi.create(body) : await salesApi.update(form._id, body)
      toast(isAdd ? `Sale ${r.data.saleNumber} created` : `Sale ${r.data.saleNumber} updated`, 'success')
      setModal(null); reload()
      setDetail(r.data)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function confirmCancel() {
    setCancelling(true)
    try {
      const r = await salesApi.cancel(cancelTarget._id)
      toast(`Sale ${r.data.saleNumber} cancelled`, 'success')
      setCancelTarget(null)
      setDetail(d => (d && d._id === r.data._id) ? r.data : d)
      reload()
    } catch (e) { toast(e.message, 'error') }
    finally { setCancelling(false) }
  }

  async function openInvoice(sale) {
    setInvoiceLoading(true)
    try {
      const r = await salesApi.invoice(sale._id)
      setInvoiceData({ sale: r.data, club: r.club })
    } catch (e) { toast(e.message, 'error') }
    finally { setInvoiceLoading(false) }
  }

  const cols = [
    { key: 'saleNumber', label: 'Sale No.', render: r => <code style={{ fontSize: 12, color: 'var(--ac)' }}>{r.saleNumber}</code> },
    { key: 'date', label: 'Date', render: r => <span style={{ fontSize: 13, color: 'var(--tx3)' }}>{formatDate(r.createdAt)}</span> },
    {
      key: 'customer', label: 'Customer', render: r => r.player
        ? <strong>{r.player.name}</strong>
        : <span>{r.customerName || 'Guest'} <span style={{ fontSize: 11, color: 'var(--tx3)' }}>(Guest)</span></span>,
    },
    {
      key: 'items', label: 'Items', render: r => (
        <div>
          <div style={{ fontSize: 13 }}>{r.items.length} item{r.items.length !== 1 ? 's' : ''}</div>
          <div style={{ fontSize: 11, color: 'var(--tx3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.items.map(i => i.chargeName).join(', ')}
          </div>
        </div>
      ),
    },
    {
      key: 'type', label: 'Type', render: r => {
        const types = [...new Set(r.items.map(i => i.chargeType))]
        return types.length === 1 ? <ChargeTypeBadge type={types[0]} /> : <Badge variant="default">Mixed</Badge>
      },
    },
    { key: 'sport', label: 'Sport', render: r => r.sport ? <span style={{ fontSize: 13 }}>{r.sport.icon} {r.sport.name}</span> : <span style={{ color: 'var(--tx3)' }}>—</span> },
    { key: 'amount', label: 'Amount', render: r => <strong style={{ color: 'var(--gr)' }}>{fmt(r.totalAmount)}</strong> },
    { key: 'paymentMode', label: 'Payment', render: r => <Badge variant={PAYMENT_MODE_COLOR[r.paymentMode] || 'default'}>{r.paymentMode}</Badge> },
    { key: 'status', label: 'Status', render: r => <SaleStatusBadge status={r.status} /> },
    {
      key: 'actions', label: '', render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn variant="ghost" size="xs" onClick={() => setDetail(r)}>View</Btn>
          {canManage && <Btn variant="ghost" size="xs" onClick={() => openInvoice(r)} disabled={invoiceLoading}>🖨</Btn>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Sales" sub="Product, rental & service transactions"
        action={canManage && <Btn size="sm" onClick={openAdd}>＋ New Sale</Btn>}
      />

      {error && <ErrMsg msg={error} />}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18, alignItems: 'flex-end' }}>
        <input
          value={search} onChange={e => changeSearch(e.target.value)}
          placeholder="🔍 Search sales…"
          style={{ maxWidth: 240 }}
        />
        <SearchableSelect
          options={players}
          value={filters.playerId}
          onChange={id => changeFilter({ playerId: id })}
          getKey={pl => pl._id}
          getLabel={pl => `${pl.name} ${pl.nickname ? `(${pl.nickname})` : ''}`.trim()}
          placeholder="All Players"
          style={{ width: 220 }}
        />
        <select value={filters.sportId} onChange={e => changeFilter({ sportId: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Sports</option>
          {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </select>
        <select value={filters.paymentMode} onChange={e => changeFilter({ paymentMode: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Payment Modes</option>
          {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filters.paymentStatus} onChange={e => changeFilter({ paymentStatus: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Payment Status</option>
          {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.status} onChange={e => changeFilter({ status: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Status</option>
          {SALE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--tx3)' }}>From Date</label>
          <input type="date" value={filters.startDate} onChange={e => changeFilter({ startDate: e.target.value })} style={{ width: 'auto' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--tx3)' }}>To Date</label>
          <input type="date" value={filters.endDate} onChange={e => changeFilter({ endDate: e.target.value })} style={{ width: 'auto' }} />
        </div>
        {hasActiveFilters && <Btn variant="ghost" size="sm" onClick={clearFilters}>Clear Filters</Btn>}
      </div>

      <Tbl
        cols={cols} rows={rows} loading={loading}
        empty={hasActiveFilters ? 'No sales match your filters.' : 'No sales found. Start recording your first sale.'}
      />
      {pg && (
        <Pagination
          page={pg.page} limit={pg.limit}
          totalRecords={pg.totalRecords} totalPages={pg.totalPages}
          hasNextPage={pg.hasNextPage} hasPreviousPage={pg.hasPreviousPage}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      )}

      {/* ── New / Edit Sale Modal ── */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'New Sale' : `Edit Sale ${form.saleNumber || ''}`}
          onClose={() => setModal(null)}
          wide
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn size="sm" loading={saving} onClick={save}>{modal === 'add' ? 'Complete Sale' : 'Save Changes'}</Btn>
            </>
          }
        >
          <FG label="Customer Type">
            <div style={{ display: 'flex', gap: 20 }}>
              {[['player', 'Registered Player'], ['guest', 'Guest / Walk-in']].map(([v, label]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input type="radio" name="customerType" checked={form.customerType === v} onChange={() => p({ customerType: v })} style={{ width: 'auto', accentColor: 'var(--ac)' }} />
                  {label}
                </label>
              ))}
            </div>
          </FG>

          {form.customerType === 'player' ? (
            <FG label="Player *">
              <SearchableSelect
                options={players}
                value={form.player}
                onChange={id => p({ player: id })}
                getKey={pl => pl._id}
                getLabel={pl => `${pl.name} — ${pl.phone}`}
                getSearchText={pl => `${pl.name} ${pl.nickname || ''}`.trim()}
                placeholder="Select player…"
              />
            </FG>
          ) : (
            <FG label="Customer Name *">
              <input value={form.customerName} onChange={e => p({ customerName: e.target.value })} placeholder="Walk-in customer name" autoFocus />
            </FG>
          )}

          <FG label="Sport (optional)">
            <select value={form.sport} onChange={e => p({ sport: e.target.value })}>
              <option value="">None — generic item</option>
              {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
            </select>
          </FG>

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '20px 0 10px', paddingTop: 16, borderTop: '1px solid var(--brd)' }}>
            Items
          </div>

          {form.items.map((item, idx) => {
            const c = itemCalcs[idx]
            return (
              <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', padding: 12, marginBottom: 10, background: 'var(--surf2)', borderRadius: 'var(--r)', border: '1px solid var(--brd)' }}>
                <div style={{ flex: '2 1 220px' }}>
                  <label style={{ fontSize: 12, color: 'var(--tx3)', display: 'block', marginBottom: 5 }}>Charge</label>
                  <select value={item.chargeId} onChange={e => selectItemCharge(idx, e.target.value)}>
                    <option value="">Select charge…</option>
                    {SELLABLE_CHARGE_TYPES.map(t => {
                      const opts = saleCharges.filter(c => c.chargeType === t)
                      if (!opts.length) return null
                      return (
                        <optgroup key={t} label={CHARGE_TYPE_LABEL[t]}>
                          {opts.map(c => <option key={c._id} value={c._id}>{c.name} — {fmt(c.base)}{c.tax ? ` (+${c.tax.rate}% ${c.tax.name})` : ''}</option>)}
                        </optgroup>
                      )
                    })}
                  </select>
                </div>
                <div style={{ flex: '0 0 auto' }}>
                  <label style={{ fontSize: 12, color: 'var(--tx3)', display: 'block', marginBottom: 5 }}>Qty</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button type="button" onClick={() => updateItemQty(idx, String(Math.max(1, (parseInt(item.quantity) || 1) - 1)))} style={QTY_BTN}>−</button>
                    <input
                      value={item.quantity}
                      onChange={e => updateItemQty(idx, e.target.value.replace(/[^\d]/g, ''))}
                      style={{ width: 46, textAlign: 'center', padding: '7px 4px' }}
                    />
                    <button type="button" onClick={() => updateItemQty(idx, String((parseInt(item.quantity) || 1) + 1))} style={QTY_BTN}>＋</button>
                  </div>
                </div>
                {c.charge && (
                  <div style={{ flex: '1 1 140px', fontSize: 12, color: 'var(--tx3)' }}>
                    <div>Unit: {fmt(c.unit)}{c.taxRate ? ` · Tax ${c.taxRate}%` : ''}</div>
                    <div style={{ fontWeight: 600, color: 'var(--tx2)' }}>Total: {fmt(c.total)}</div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={form.items.length <= 1}
                  title={form.items.length <= 1 ? 'At least one item is required' : 'Remove item'}
                  style={{ marginLeft: 'auto', background: 'var(--rdD)', color: 'var(--rd)', border: '1px solid rgba(255,87,87,.25)', borderRadius: 'var(--r)', padding: '6px 10px', fontSize: 12, cursor: form.items.length <= 1 ? 'not-allowed' : 'pointer', opacity: form.items.length <= 1 ? .5 : 1 }}
                >
                  Remove
                </button>
              </div>
            )
          })}

          <Btn variant="ghost" size="sm" onClick={addItem} style={{ marginBottom: 18 }}>＋ Add Item</Btn>

          <FRow>
            <FG label="Discount (₹)">
              <input type="number" min="0" max={maxDiscount} value={form.discountAmount} onChange={e => p({ discountAmount: e.target.value })} />
            </FG>
            <FG label="Mode of Payment *">
              <select value={form.paymentMode} onChange={e => p({ paymentMode: e.target.value })}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FG>
          </FRow>

          <FG label="Payment Status">
            <select value={form.paymentStatus} onChange={e => p({ paymentStatus: e.target.value })}>
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FG>

          <FG label="Notes (optional)">
            <textarea value={form.notes} onChange={e => p({ notes: e.target.value })} rows={2} placeholder="Any additional notes for this sale" style={{ resize: 'vertical' }} />
          </FG>

          <InfoBox>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--tx2)' }}><span>Tax</span><span>+ {fmt(taxTotal)}</span></div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gr)' }}><span>Discount</span><span>− {fmt(discountAmount)}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, borderTop: '1px solid var(--brd)', paddingTop: 6, marginTop: 2 }}>
                <span>Grand Total</span><span style={{ color: 'var(--ac)' }}>{fmt(grandTotal)}</span>
              </div>
            </div>
          </InfoBox>
        </Modal>
      )}

      {/* ── Sale Detail Modal ── */}
      {detail && (
        <Modal
          title={`Sale ${detail.saleNumber}`}
          onClose={() => setDetail(null)}
          wide
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setDetail(null)}>Close</Btn>
              {canManage && detail.status !== 'Cancelled' && <Btn variant="ghost" size="sm" onClick={() => openEdit(detail)}>Edit</Btn>}
              {canManage && detail.status !== 'Cancelled' && <Btn variant="danger" size="sm" onClick={() => setCancelTarget(detail)}>Cancel Sale</Btn>}
              {canManage && <Btn size="sm" loading={invoiceLoading} onClick={() => openInvoice(detail)}>🖨 Print Invoice</Btn>}
            </>
          }
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Date</div>
              <div style={{ fontSize: 13 }}>{formatDateTime(detail.createdAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Status</div>
              <SaleStatusBadge status={detail.status} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: 'var(--surf2)', padding: '12px 16px', borderRadius: 'var(--r)', marginBottom: 18, fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, textTransform: 'uppercase', color: 'var(--tx3)' }}>Customer</div>
              {detail.player
                ? <div><strong>{detail.player.name}</strong><div style={{ fontSize: 12, color: 'var(--tx3)' }}>{detail.player.phone}</div></div>
                : <div><strong>{detail.customerName || 'Guest'}</strong> <span style={{ fontSize: 11, color: 'var(--tx3)' }}>(Guest)</span></div>}
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, textTransform: 'uppercase', color: 'var(--tx3)' }}>Sport</div>
              {detail.sport ? <span>{detail.sport.icon} {detail.sport.name}</span> : <span style={{ color: 'var(--tx3)' }}>—</span>}
            </div>
          </div>

          <Tbl
            cols={[
              { key: 'name', label: 'Item', render: i => <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span>{i.chargeName}</span><ChargeTypeBadge type={i.chargeType} /></div> },
              { key: 'qty', label: 'Qty', render: i => i.quantity },
              { key: 'unit', label: 'Unit Price', render: i => fmt(i.unitAmount) },
              { key: 'tax', label: 'Tax', render: i => i.taxRate ? `${i.taxRate}%` : '—' },
              { key: 'total', label: 'Total', render: i => <strong>{fmt(i.totalAmount)}</strong> },
            ]}
            rows={detail.items}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 18 }}>
            <div style={{ minWidth: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Subtotal</span><span>{fmt(detail.subtotal)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx2)', marginBottom: 4 }}><span>Tax</span><span>+ {fmt(detail.taxAmount)}</span></div>
              {detail.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gr)', marginBottom: 4 }}><span>Discount</span><span>− {fmt(detail.discountAmount)}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17, borderTop: '1px solid var(--brd)', paddingTop: 8, marginTop: 4 }}>
                <span>Grand Total</span><span style={{ color: 'var(--ac)' }}>{fmt(detail.totalAmount)}</span>
              </div>
            </div>
          </div>

          <FRow>
            <FG label="Payment Method"><Badge variant={PAYMENT_MODE_COLOR[detail.paymentMode] || 'default'}>{detail.paymentMode}</Badge></FG>
            <FG label="Payment Status"><Badge variant={PAY_STATUS_COLOR[detail.paymentStatus] || 'default'}>{detail.paymentStatus}</Badge></FG>
          </FRow>

          {detail.notes && <InfoBox>{detail.notes}</InfoBox>}
        </Modal>
      )}

      {/* ── Cancel Confirmation ── */}
      {cancelTarget && (
        <Modal
          title="Cancel Sale?"
          onClose={() => setCancelTarget(null)}
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setCancelTarget(null)}>Keep Sale</Btn>
              <Btn variant="danger" size="sm" loading={cancelling} onClick={confirmCancel}>Cancel Sale</Btn>
            </>
          }
        >
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>
            Are you sure you want to cancel sale <strong>{cancelTarget.saleNumber}</strong>?<br />
            This action will affect the associated income record.
          </p>
        </Modal>
      )}

      {/* ── Invoice Modal ── */}
      {invoiceData && (
        <Modal
          title={`Invoice — ${invoiceData.sale.saleNumber}`}
          onClose={() => setInvoiceData(null)}
          wide
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setInvoiceData(null)}>Close</Btn>
              <Btn size="sm" onClick={() => window.print()}>🖨 Print</Btn>
            </>
          }
        >
          <SaleInvoiceView sale={invoiceData.sale} club={invoiceData.club} />
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════ INVOICE VIEW ══════════════════════════════ */
function SaleInvoiceView({ sale, club }) {
  return (
    <div style={{ background: '#fff', color: '#111', borderRadius: 12, padding: 28, fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--ffH)', fontSize: 22, fontWeight: 800 }}>
            <img src={logoImg} alt="Logo" width="30" style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {club?.name || 'SportsPlex'}
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 3, lineHeight: 1.8 }}>
            {club?.address || 'Chennai, Tamil Nadu'}<br />
            {club?.gstin && <>GSTIN: {club.gstin}<br /></>}
            {[club?.phone, club?.email].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--ffH)', fontSize: 22, fontWeight: 700 }}>INVOICE</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>#{sale.saleNumber}<br />{formatDate(sale.createdAt)}</div>
        </div>
      </div>

      <div style={{ background: '#f8f8f8', padding: '12px 16px', borderRadius: 8, marginBottom: 18, fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 5, fontSize: 10, textTransform: 'uppercase', color: '#999' }}>Bill To</div>
        {sale.player
          ? <><div style={{ fontWeight: 600 }}>{sale.player.name}</div><div style={{ color: '#666' }}>{sale.player.phone}</div></>
          : <div style={{ fontWeight: 600 }}>{sale.customerName || 'Guest'}</div>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Item', 'Qty', 'Rate', 'Tax', 'Total'].map(h => (
              <th key={h} style={{ background: '#f0f0f0', padding: '9px 14px', textAlign: h === 'Item' ? 'left' : 'right', fontSize: 11, textTransform: 'uppercase', color: '#666' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sale.items.map((it, i) => (
            <tr key={it._id || i}>
              <td style={{ padding: '9px 14px' }}>{it.chargeName}</td>
              <td style={{ padding: '9px 14px', textAlign: 'right' }}>{it.quantity}</td>
              <td style={{ padding: '9px 14px', textAlign: 'right' }}>₹{(it.unitAmount || 0).toLocaleString()}</td>
              <td style={{ padding: '9px 14px', textAlign: 'right' }}>{it.taxRate || 0}%</td>
              <td style={{ padding: '9px 14px', textAlign: 'right' }}>₹{(it.totalAmount || 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ padding: '12px 14px', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal</span><span>₹{(sale.subtotal || 0).toLocaleString()}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginBottom: 4 }}><span>Tax</span><span>₹{(sale.taxAmount || 0).toLocaleString()}</span></div>
        {sale.discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green', marginBottom: 4 }}><span>Discount</span><span>−₹{sale.discountAmount.toLocaleString()}</span></div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', color: '#fff', padding: '13px 14px', borderRadius: '0 0 8px 8px', fontWeight: 700 }}>
        <span>TOTAL AMOUNT</span>
        <span style={{ fontSize: 18 }}>₹{(sale.totalAmount || 0).toLocaleString()}</span>
      </div>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
        <span>Payment Mode: {sale.paymentMode}</span><span>Payment Status: {sale.paymentStatus}</span>
      </div>

      <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: '#999' }}>
        Thank you for your business!
      </div>
    </div>
  )
}
