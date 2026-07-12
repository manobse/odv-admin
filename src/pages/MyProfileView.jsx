import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { playersApi, bookingsApi, sportsApi, courtsApi, chargesApi } from '../api/client'
import { Btn, Badge, Tbl, Modal, FG, FRow, Spinner, PageHeader, InfoBox, Avatar } from '../components/ui'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const today = () => new Date().toISOString().slice(0, 10)

/* ══════════════════════════════ MY PROFILE ══════════════════════════════════ */
export function MyProfile() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => bookingsApi.list({ limit: 50 }))
  const { data: pD  } = useAsync(() => playersApi.list({ limit: 200 }))
  const { data: sD  } = useAsync(() => sportsApi.list({ limit: 50 }))
  const { data: coD } = useAsync(() => courtsApi.list({ limit: 100 }))
  const { data: chD } = useAsync(() => chargesApi.list({ limit: 100 }))
  const [modal,   setModal]   = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({ player:'', sport:'', court:'', charge:'', date:today(), timeFrom:'08:00', timeTo:'09:00', discount:0, discountType:'flat', notes:'' })
  const p = f => setForm(prev => ({ ...prev, ...f }))

  const players    = pD?.data || []
  const sports     = (sD?.data || []).filter(x => x.active)
  const allCourts  = coD?.data || []
  const allCharges = chD?.data || []
  const fCourts    = form.sport ? allCourts.filter(c => c.sport?._id === form.sport && c.active) : []
  const fCharges   = form.sport ? allCharges.filter(c => c.sport?._id === form.sport && c.active) : []
  const selCharge  = allCharges.find(c => c._id === form.charge)
  const selTax     = selCharge?.tax
  const base       = selCharge?.base || 0
  const taxAmt     = base * (selTax?.rate || 0) / 100
  const disc       = form.discountType === 'flat' ? +form.discount : base * (+form.discount / 100)
  const total      = base + taxAmt - disc

  async function save() {
    if (!form.player || !form.sport || !form.court || !form.charge) {
      toast('Please fill all required fields', 'error'); return
    }
    setSaving(true)
    try {
      const r = await bookingsApi.create({ ...form, discount: disc, discountType: 'flat' })
      toast('Booking confirmed!', 'success')
      reload(); setModal(null); setInvoice(r.data)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const cols = [
    { key:'column', label:'Column', render: r => <code style={{ fontSize:12, color:'var(--accent)' }}>{r.bookingId}</code> },
    { key:'value',    label:'Value',     render: r => (
      <div>
        <div style={{ fontSize:13 }}>
          {/* {r.sport?.icon} {r.sport?.name} */}
        </div>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="My Profile" sub="Profile management"
        action={
          <Btn size="sm" onClick={() => { setForm({ player:'', sport:'', court:'', charge:'', date:today(), timeFrom:'08:00', timeTo:'09:00', discount:0, discountType:'flat', notes:'' }); setModal('add') }}>
            ＋ Change password
          </Btn>
        }
      />
      <Tbl cols={cols} rows={data?.data || []} loading={loading} />

      {/* ── Change password Modal ── */}
      {modal && (
        <Modal title="Change password" onClose={() => setModal(null)}
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Confirm Booking</Btn></>}>
          <FG label="Player *">
            <select value={form.player} onChange={e => p({ player: e.target.value })}>
              <option value="">Select player…</option>
              {players.map(pl => <option key={pl._id} value={pl._id}>{pl.name} — {pl.phone}</option>)}
            </select>
          </FG>
          <FRow>
            <FG label="Sport *">
              <select value={form.sport} onChange={e => p({ sport: e.target.value, court:'', charge:'' })}>
                <option value="">Select sport…</option>
                {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
              </select>
            </FG>
            <FG label="Court *">
              <select value={form.court} onChange={e => p({ court: e.target.value })}>
                <option value="">Select court…</option>
                {fCourts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </FG>
          </FRow>
          <FG label="Charge Option *">
            <select value={form.charge} onChange={e => p({ charge: e.target.value })}>
              <option value="">Select charge…</option>
              {fCharges.map(c => <option key={c._id} value={c._id}>{c.name} — {fmt(c.base)}</option>)}
            </select>
          </FG>
          <FRow>
            <FG label="Date *"><input type="date" value={form.date} onChange={e => p({ date: e.target.value })} /></FG>
            <FG label="From *"><input type="time" value={form.timeFrom} onChange={e => p({ timeFrom: e.target.value })} /></FG>
          </FRow>
          <FRow>
            <FG label="To *"><input type="time" value={form.timeTo} onChange={e => p({ timeTo: e.target.value })} /></FG>
            <FG label="Discount">
              <div style={{ display:'flex', gap:6 }}>
                <input type="number" value={form.discount} onChange={e => p({ discount: e.target.value })} min="0" style={{ flex:1 }} />
                <select value={form.discountType} onChange={e => p({ discountType: e.target.value })} style={{ width:'auto' }}>
                  <option value="flat">₹ Flat</option>
                  <option value="percent">% Off</option>
                </select>
              </div>
            </FG>
          </FRow>
          {selCharge && (
            <InfoBox>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span>Base Amount</span><span>{fmt(base)}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text2)' }}><span>Tax ({selTax?.rate || 0}%)</span><span>+ {fmt(taxAmt)}</span></div>
                {disc > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--green)' }}><span>Discount</span><span>− {fmt(disc)}</span></div>}
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:16, borderTop:'1px solid var(--border)', paddingTop:6, marginTop:2 }}>
                  <span>Total</span><span style={{ color:'var(--accent)' }}>{fmt(total)}</span>
                </div>
              </div>
            </InfoBox>
          )}
        </Modal>
      )}
    </div>
  )
}
