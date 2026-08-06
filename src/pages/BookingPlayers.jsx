import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { calculateAge, formatDate } from '../helpers'
import { playersApi, bookingsApi, sportsApi, courtsApi, chargesApi } from '../api/client'
import { Btn, Badge, Tbl, Modal, FG, FRow, Spinner, PageHeader, InfoBox, Avatar } from '../components/ui'
import logoImg from '../assets/logo.png'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const today = () => new Date().toISOString().slice(0, 10)
const maxDate = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 4)
  return date.toISOString().slice(0, 10)
}

const GENDERS       = ['', 'Male', 'Female', 'Other']
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer']
const RELATIONS     = ['', 'Parent', 'Spouse', 'Sibling', 'Friend', 'Guardian', 'Other']

const EMPTY_PLAYER = {
  name: '', phone: '', email: '', primarySport: '', active: true,
  dob: '', gender: '', address: '',
  emergencyContact: { fullName: '', relation: '', phone: '' },
  medicalInfo: { hasMedicalCondition: false, details: '' },
}

/* ══════════════════════════════ PLAYERS ═══════════════════════════════════ */
export function Players() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const { data, loading, reload } = useAsync(
    () => playersApi.list({ limit: 100, ...(search ? { search } : {}) }),
    [search]
  )
  const playersList = data?.data?.map((item, index) => ({
    srNo: index + 1,
    ...item
  }))
  const { data: sD } = useAsync(() => sportsApi.list({ limit: 50 }))
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState(EMPTY_PLAYER)
  const [saving, setSaving] = useState(false)
  const sports = sD?.data || []

  // Top-level field updater
  const p = f => setForm(prev => ({ ...prev, ...f }))

  // Nested updater for emergencyContact
  const pEC = f => setForm(prev => ({
    ...prev,
    emergencyContact: { ...prev.emergencyContact, ...f },
  }))

  // Nested updater for medicalInfo
  const pMI = f => setForm(prev => ({
    ...prev,
    medicalInfo: { ...prev.medicalInfo, ...f },
  }))

  async function save() {
    if (!form.name || !form.phone) { toast('Name & phone required', 'error'); return }
    setSaving(true)
    try {
      if (modal === 'add') await playersApi.create(form)
      else await playersApi.update(form._id, form)
      toast('Saved', 'success'); reload(); setModal(null)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  function openEdit(r) {
    setForm({
      ...EMPTY_PLAYER,
      ...r,
      primarySport: typeof r.primarySport === 'object' ? r.primarySport._id : r.primarySport,
      emergencyContact: { ...EMPTY_PLAYER.emergencyContact, ...(r.emergencyContact || {}) },
      medicalInfo:      { ...EMPTY_PLAYER.medicalInfo,      ...(r.medicalInfo      || {}) },
    })
    setModal('edit')
  }

  function openAdd() {
    setForm({ ...EMPTY_PLAYER, primarySport: sports[0]?._id || '' })
    setModal('add')
  }

  // ── Table columns (includes new DOB, Address, Gender) ─────────────────────
  const cols = [
    { key:'srNo',   label:'S. No',   render: r => <span style={{ fontSize:13 }}>{r.srNo}</span> },
    {
      key: 'player', label: 'Player', render: r => (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Avatar name={r.name} size={32} />
          <div>
            <div style={{ fontWeight:500 }}>{r.name}</div>
            <div style={{ fontSize:12, color:'var(--text2)' }}>{r.nickname}</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { key:'phone',   label:'Phone',   render: r => <span style={{ fontSize:13 }}>{r.phone}</span> },
    { key:'dob',     label:'DOB',     render: r => <span style={{ fontSize:12, color:'var(--text2)' }}>{formatDate(r.dob) || '—'}</span> },
    // { key:'age',     label:'Age',     render: r => <span style={{ fontSize:12, color:'var(--text2)' }}>{calculateAge(r.dob)} Years</span> },
    { key:'gender',  label:'Gender',  render: r => r.gender ? <Badge variant="blue">{r.gender}</Badge> : <span style={{ color:'var(--text3)' }}>—</span> },
    // { key:'address', label:'Address', render: r => <span style={{ fontSize:12, color:'var(--text3)', maxWidth:160, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.address || '—'}</span> },
    {
      key: 'sport', label: 'Sport', render: r => {
        const sp = typeof r.primarySport === 'object' ? r.primarySport : sports.find(x => x._id === r.primarySport)
        return <span style={{ color: sp?.color, fontSize:13 }}>{sp?.icon} {sp?.name || '—'}</span>
      },
    },
    // { key:'status',  label:'Status',  render: r => <Badge variant={r.active !== false ? 'green' : 'red'}>{r.active !== false ? 'Active' : 'Inactive'}</Badge> },
    { key:'actions', label:'',        render: r => <Btn variant="ghost" size="xs" onClick={() => openEdit(r)}>Edit</Btn> },
  ]

  return (
    <div>
      <PageHeader
        title="Players" sub="Member management"
        action={<Btn size="sm" onClick={openAdd}>＋ Add Player</Btn>}
      />
      <div style={{ marginBottom:18 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name, phone or email…"
          style={{ maxWidth:340 }}
        />
      </div>
      <Tbl cols={cols} rows={playersList || []} loading={loading} />

      {/* ── Add / Edit Player Modal ── */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Player' : 'Edit Player'}
          onClose={() => setModal(null)}
          wide
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn size="sm" loading={saving} onClick={save}>Save Player</Btn>
            </>
          }
        >
          {/* ── Basic Info ── */}
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Basic Information</div>

          <FRow>
            <FG label="Full Name *">
              <input value={form.name} onChange={e => p({ name: e.target.value })} placeholder="Player name" autoFocus />
            </FG>
            <FG label="Nick Name">
              <input value={form.nickname} onChange={e => p({ nickname: e.target.value })} placeholder="Player nick name (Optional)" />
            </FG>
          </FRow>

          <FRow>
            <FG label="Phone *">
              <input value={form.phone} onChange={e => p({ phone: e.target.value })} placeholder="Mobile number" />
            </FG>
            <FG label="Email">
              <input value={form.email} onChange={e => p({ email: e.target.value })} placeholder="Email (optional)" />
            </FG>
          </FRow>

          <FRow>
            <FG label="Date of Birth">
              <input type="date" value={form.dob} onChange={e => p({ dob: e.target.value })} max={maxDate()} />
            </FG>
            <FG label="Gender">
              <select value={form.gender} onChange={e => p({ gender: e.target.value })}>
                {GENDERS.map(g => <option key={g} value={g}>{g || 'Select gender…'}</option>)}
              </select>
            </FG>
          </FRow>

          <FG label="Address">
            <textarea
              value={form.address}
              onChange={e => p({ address: e.target.value })}
              placeholder="Full address"
              rows={3}
              style={{ resize:'vertical' }}
            />
          </FG>

          <FG label="Primary Sport">
            <select value={form.primarySport} onChange={e => p({ primarySport: e.target.value })}>
              <option value="">Select sport…</option>
              {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
            </select>
          </FG>

          {/* ── Emergency Contact ── */}
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', margin:'20px 0 12px', paddingTop:16, borderTop:'1px solid var(--border)' }}>
            Emergency Contact
          </div>

          <FRow>
            <FG label="Full Name">
              <input
                value={form.emergencyContact.fullName}
                onChange={e => pEC({ fullName: e.target.value })}
                placeholder="Contact person name"
              />
            </FG>
            <FG label="Relation">
              <select value={form.emergencyContact.relation} onChange={e => pEC({ relation: e.target.value })}>
                {RELATIONS.map(r => <option key={r} value={r}>{r || 'Select relation…'}</option>)}
              </select>
            </FG>
          </FRow>

          <FG label="Phone Number">
            <input
              value={form.emergencyContact.phone}
              onChange={e => pEC({ phone: e.target.value })}
              placeholder="Emergency contact number"
              style={{ maxWidth:'50%' }}
            />
          </FG>

          {/* ── Medical Information ── */}
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', margin:'20px 0 12px', paddingTop:16, borderTop:'1px solid var(--border)' }}>
            Medical Information
          </div>

          <FG label="Do you have any medical conditions we should be aware of?">
            <div style={{ display:'flex', gap:20, marginTop:4 }}>
              {[true, false].map(v => (
                <label key={String(v)} style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer' }}>
                  <input
                    type="radio"
                    name="medCond"
                    checked={form.medicalInfo.hasMedicalCondition === v}
                    onChange={() => pMI({ hasMedicalCondition: v, details: v ? form.medicalInfo.details : '' })}
                    style={{ width:'auto', accentColor:'var(--accent)' }}
                  />
                  {v ? 'Yes' : 'No'}
                </label>
              ))}
            </div>
          </FG>

          {form.medicalInfo.hasMedicalCondition && (
            <FG label="Please specify the medical condition(s)">
              <textarea
                value={form.medicalInfo.details}
                onChange={e => pMI({ details: e.target.value })}
                placeholder="Describe any medical conditions, allergies, medications, or special requirements…"
                rows={3}
                style={{ resize:'vertical' }}
              />
            </FG>
          )}
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════ BOOKINGS ══════════════════════════════════ */
export function Bookings() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => bookingsApi.list({ limit: 50 }))
  const { data: pD  } = useAsync(() => playersApi.list({ limit: 200 }))
  const { data: sD  } = useAsync(() => sportsApi.list({ limit: 50 }))
  const { data: coD } = useAsync(() => courtsApi.list({ limit: 100 }))
  const { data: chD } = useAsync(() => chargesApi.list({ limit: 100 }))
  const [modal,   setModal]   = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({
    player:'', sport:'', court:'', charge:'',
    date: today(), timeFrom:'08:00', timeTo:'09:00',
    discount:0, discountType:'flat',
    paymentMode: 'Cash',
    notes:'',
  })
  const p = f => setForm(prev => ({ ...prev, ...f }))

  const players    = pD?.data.sort((a, b) => a.name.localeCompare(b.name)) || []
  const sports     = (sD?.data || []).filter(x => x.active)
  const allCourts  = coD?.data || []
  const allCharges = chD?.data || []
  const fCourts    = form.sport ? allCourts.filter(c => c.sport?._id === form.sport && c.active)  : []
  const fCharges   = form.sport ? allCharges.filter(c => c.sport?._id === form.sport && c.active) : []
  const selCharge  = allCharges.find(c => c._id === form.charge)
  const selTax     = selCharge?.tax
  const base       = selCharge?.base || 0
  const taxAmt     = base * (selTax?.rate || 0) / 100
  const disc       = form.discountType === 'flat' ? +form.discount : base * (+form.discount / 100)
  const total      = base + taxAmt - disc

  function resetForm() {
    setForm({
      player:'', sport:sports[0]?._id, court: allCourts[0]?._id, charge:'',
      date: today(), timeFrom:'08:00', timeTo:'09:00',
      discount:0, discountType:'flat',
      paymentMode: 'Cash',
      notes:'',
    })
  }

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
    { key:'bookingId', label:'Booking ID',    render: r => <code style={{ fontSize:12, color:'var(--accent)' }}>{r.bookingId}</code> },
    { key:'player',    label:'Player',         render: r => <strong>{r.player?.name || '—'}</strong> },
    {
      key: 'sport', label: 'Sport / Court', render: r => (
        <div>
          <div style={{ fontSize:13 }}>{r.sport?.icon} {r.sport?.name}</div>
          <div style={{ fontSize:11, color:'var(--text2)' }}>{r.court?.name}</div>
        </div>
      ),
    },
    {
      key: 'date', label: 'Date & Time', render: r => (
        <div>
          <div style={{ fontSize:13 }}>{formatDate(r.date)}</div>
          <div style={{ fontSize:11, color:'var(--text2)' }}>{r.timeFrom} – {r.timeTo}</div>
        </div>
      ),
    },
    { key:'total',       label:'Amount',  render: r => <strong>{fmt(r.totalAmount)}</strong> },
    {
      key: 'paymentMode', label: 'Payment Mode', render: r => {
        const colors = { Cash:'blue', UPI:'teal', Card:'accent', 'Bank Transfer':'amber' }
        return r.paymentMode
          ? <Badge variant={colors[r.paymentMode] || 'default'}>{r.paymentMode}</Badge>
          : <span style={{ color:'var(--text3)' }}>—</span>
      },
    },
    { key:'status', label:'Status', render: r => <Badge variant={r.status === 'Confirmed' ? 'green' : r.status === 'Pending' ? 'amber' : 'red'}>{r.status}</Badge> },
    { key:'inv',    label:'Invoice', render: r => <Btn variant="ghost" size="xs" onClick={() => setInvoice(r)}>View</Btn> },
  ]

  return (
    <div>
      <PageHeader
        title="Bookings" sub="Slot booking management"
        action={
          <Btn size="sm" onClick={() => { resetForm(); setModal('add') }}>
            ＋ New Booking
          </Btn>
        }
      />
      <Tbl cols={cols} rows={data?.data || []} loading={loading} />

      {/* ── New Booking Modal ── */}
      {modal && (
        <Modal
          title="New Booking"
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn size="sm" loading={saving} onClick={save}>Confirm Booking</Btn>
            </>
          }
        >
          <FG label="Player *">
            <select value={form.player} onChange={e => p({ player: e.target.value })}>
              <option value="">Select player…</option>
              {players.map(pl => <option key={pl._id} value={pl._id}>{pl.name} {pl.nickname ? `(${pl.nickname})` : ""} — {pl.phone}</option>)}
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
            <FG label="Date *">
              <input type="date" value={form.date} onChange={e => p({ date: e.target.value })} />
            </FG>
            <FG label="From *">
              <input type="time" value={form.timeFrom} onChange={e => p({ timeFrom: e.target.value })} />
            </FG>
          </FRow>

          <FRow>
            <FG label="To *">
              <input type="time" value={form.timeTo} onChange={e => p({ timeTo: e.target.value })} />
            </FG>
            <FG label="Mode of Payment *">
              <select value={form.paymentMode} onChange={e => p({ paymentMode: e.target.value })}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FG>
          </FRow>

          <FG label="Discount">
            <div style={{ display:'flex', gap:6 }}>
              <input
                type="number" value={form.discount}
                onChange={e => p({ discount: e.target.value })}
                min="0" style={{ flex:1 }}
              />
              <select value={form.discountType} onChange={e => p({ discountType: e.target.value })} style={{ width:'auto' }}>
                <option value="flat">₹ Flat</option>
                <option value="percent">% Off</option>
              </select>
            </div>
          </FG>

          {selCharge && (
            <InfoBox>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span>Base Amount</span><span>{fmt(base)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text2)' }}>
                  <span>Tax ({selTax?.rate || 0}%)</span><span>+ {fmt(taxAmt)}</span>
                </div>
                {disc > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--green)' }}>
                    <span>Discount</span><span>− {fmt(disc)}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:16, borderTop:'1px solid var(--border)', paddingTop:6, marginTop:2 }}>
                  <span>Total</span><span style={{ color:'var(--accent)' }}>{fmt(total)}</span>
                </div>
              </div>
            </InfoBox>
          )}
        </Modal>
      )}

      {/* ── Invoice Modal ── */}
      {invoice && (
        <Modal
          title={`Invoice — ${invoice.bookingId}`}
          onClose={() => setInvoice(null)}
          wide
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setInvoice(null)}>Close</Btn>
              <Btn size="sm" onClick={() => window.print()}>🖨 Print</Btn>
            </>
          }
        >
          <InvoiceView b={invoice} />
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════ INVOICE VIEW ══════════════════════════════ */
function InvoiceView({ b }) {
  return (
    <div style={{ background:'#fff', color:'#111', borderRadius:12, padding:28, fontSize:13 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--ffH)', fontSize:22, fontWeight:800 }}>
            <img src={logoImg} alt="Logo" width="30px" style={{ verticalAlign:'middle', marginRight:6 }} />
            Odi Vilayadu
          </div>
          <div style={{ fontSize:11, color:'#666', marginTop:3, lineHeight:1.8 }}>
            Premium Sports Club<br />Chennai, Tamil Nadu<br />GSTIN: 29ABCDE1234F1Z5
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--ffH)', fontSize:22, fontWeight:700 }}>INVOICE</div>
          <div style={{ fontSize:12, color:'#666', marginTop:3 }}>#{b.bookingId}<br />{b.date}</div>
        </div>
      </div>

      {/* Bill To + Booking Details */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, background:'#f8f8f8', padding:'12px 16px', borderRadius:8, marginBottom:18, fontSize:12 }}>
        <div>
          <div style={{ fontWeight:600, marginBottom:5, fontSize:10, textTransform:'uppercase', color:'#999' }}>Bill To</div>
          <div style={{ fontWeight:600 }}>{b.player?.name}</div>
          <div style={{ color:'#666' }}>{b.player?.phone}<br />{b.player?.email}</div>
        </div>
        <div>
          <div style={{ fontWeight:600, marginBottom:5, fontSize:10, textTransform:'uppercase', color:'#999' }}>Booking Details</div>
          <div style={{ color:'#444', lineHeight:1.8 }}>
            {b.sport?.icon} {b.sport?.name}<br />
            📍 {b.court?.name}<br />
            ⏱ {b.timeFrom} – {b.timeTo}
          </div>
        </div>
      </div>

      {/* Line items */}
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginBottom:0 }}>
        <thead>
          <tr>
            {['Description', 'Amount'].map(h => (
              <th key={h} style={{ background:'#f0f0f0', padding:'9px 14px', textAlign: h === 'Amount' ? 'right' : 'left', fontSize:11, textTransform:'uppercase', color:'#666' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding:'9px 14px' }}>{b.sport?.name} · {b.court?.name} ({b.timeFrom}–{b.timeTo})</td>
            <td style={{ padding:'9px 14px', textAlign:'right' }}>₹{(b.baseAmount || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ padding:'9px 14px', color:'#666' }}>Tax</td>
            <td style={{ padding:'9px 14px', textAlign:'right', color:'#666' }}>₹{(b.taxAmount || 0).toLocaleString()}</td>
          </tr>
          {b.discount > 0 && (
            <tr>
              <td style={{ padding:'9px 14px', color:'green' }}>Discount</td>
              <td style={{ padding:'9px 14px', textAlign:'right', color:'green' }}>−₹{b.discount.toLocaleString()}</td>
            </tr>
          )}
          {b.paymentMode && (
            <tr>
              <td style={{ padding:'9px 14px', color:'#666' }}>Payment Mode</td>
              <td style={{ padding:'9px 14px', textAlign:'right', fontWeight:500 }}>{b.paymentMode}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Total */}
      <div style={{ display:'flex', justifyContent:'space-between', background:'#111', color:'#fff', padding:'13px 14px', borderRadius:'0 0 8px 8px', fontWeight:700 }}>
        <span>TOTAL AMOUNT</span>
        <span style={{ fontSize:18 }}>₹{(b.totalAmount || 0).toLocaleString()}</span>
      </div>

      <div style={{ marginTop:14, textAlign:'center', fontSize:11, color:'#999' }}>
        Thank you for booking with SportsPlex! Payment confirmed.
      </div>
    </div>
  )
}
