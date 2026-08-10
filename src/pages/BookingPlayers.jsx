import { useState, useEffect } from 'react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { calculateAge, formatDate } from '../helpers'
import { playersApi, bookingsApi, sportsApi, courtsApi, chargesApi } from '../api/client'
import { Btn, Badge, Tbl, Modal, FG, FRow, Spinner, PageHeader, InfoBox, Avatar, Pagination, ErrMsg } from '../components/ui'
import { PAYMENT_MODES, PAYMENT_MODE_COLOR } from '../constants/paymentModes'
import logoImg from '../assets/logo.png'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const today = () => new Date().toISOString().slice(0, 10)
const maxDate = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 4)
  return date.toISOString().slice(0, 10)
}

const GENDERS       = ['', 'Male', 'Female', 'Other']
const RELATIONS     = ['', 'Parent', 'Spouse', 'Sibling', 'Friend', 'Guardian', 'Other']
const BOOKING_STATUSES = ['Confirmed', 'Pending', 'Cancelled']
const emptyBookingFilters = { playerId: '', sportId: '', chargeId: '', paymentMode: '', status: '', startDate: '', endDate: '' }

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
  const [page,   setPage]   = useState(1)
  const [limit,  setLimit]  = useState(50)
  const { data, loading, reload } = useAsync(
    () => playersApi.list({ page, limit, ...(search ? { search } : {}) }),
    [search, page, limit]
  )
  const pg = data?.pagination
  const playersList = data?.data?.map((item, index) => ({
    srNo: (page - 1) * limit + index + 1,
    ...item
  }))

  const { data: sD } = useAsync(() => sportsApi.list({ limit: 50 }))
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState(EMPTY_PLAYER)
  const [saving, setSaving] = useState(false)
  const sports = sD?.data || []

  function changeSearch(v) { setSearch(v); setPage(1) }
  function changeLimit(l)  { setLimit(l); setPage(1) }

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
    { key:'dob',     label:'DOB',     render: r => <span style={{ fontSize:12, color:'var(--text2)' }}>{formatDate(r.dob)}</span> },
    { key:'age',     label:'Age',     render: r => <span style={{ fontSize:12, color:'var(--text2)' }}>{calculateAge(r.dob)}</span> },
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
          value={search} onChange={e => changeSearch(e.target.value)}
          placeholder="🔍 Search by name, phone or email…"
          style={{ maxWidth:340 }}
        />
      </div>
      <Tbl
        cols={cols} rows={playersList || []} loading={loading}
        empty={search ? 'No matching players found.' : 'No players found.'}
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
  const [page,    setPage]    = useState(1)
  const [limit,   setLimit]   = useState(50)
  const [filters, setFilters] = useState(emptyBookingFilters)
  const hasClientFilter = !!(filters.startDate || filters.endDate || filters.paymentMode || filters.chargeId)
  // The bookings API only recognizes `player`/`sport`/`status` as filter params
  // (unlike Sales, which also supports playerId/sportId/paymentMode/search/date-range) —
  // it silently ignores anything else, including `paymentMode`, `charge` and a `date`
  // range, so those are applied client-side instead of via query params. Since that
  // means filtering happens after the server has already paginated, an active client
  // filter widens the fetch to the max page size and the server's page controls are
  // replaced with a plain match count below — page-by-page navigation can't be trusted
  // once the visible rows no longer correspond to the server's own page boundaries.
  const { data, loading, error, reload } = useAsync(
    () => bookingsApi.list({
      page: hasClientFilter ? 1 : page,
      limit: hasClientFilter ? 200 : limit,
      ...(filters.playerId ? { player: filters.playerId } : {}),
      ...(filters.sportId  ? { sport:  filters.sportId  } : {}),
      ...(filters.status   ? { status: filters.status   } : {}),
    }),
    [page, limit, filters.playerId, filters.sportId, filters.status, hasClientFilter]
  )
  const { data: pD  } = useAsync(() => playersApi.list({ limit: 200 }))
  const { data: sD  } = useAsync(() => sportsApi.list({ limit: 50 }))
  const { data: coD } = useAsync(() => courtsApi.list({ limit: 100 }))
  const [modal,   setModal]   = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({
    player:'', sport:'', court:'', charge:'',
    date: today(), timeFrom:'08:00', timeTo:'09:00',
    discount:0, discountType:'flat',
    paymentMode: 'UPI',
    notes:'',
  })
  const p = f => setForm(prev => ({ ...prev, ...f }))

  function changeFilter(f) { setFilters(prev => ({ ...prev, ...f })); setPage(1) }
  function changeLimit(l)  { setLimit(l); setPage(1) }
  function clearFilters()  { setFilters(emptyBookingFilters); setPage(1) }
  const hasActiveFilters = Object.values(filters).some(Boolean)

  const rows = (data?.data || []).filter(r =>
    (!filters.startDate   || r.date >= filters.startDate) &&
    (!filters.endDate     || r.date <= filters.endDate) &&
    (!filters.paymentMode || r.paymentMode === filters.paymentMode) &&
    (!filters.chargeId    || (r.charge?._id || r.charge) === filters.chargeId)
  )

  // Server-side `chargeType` filtering can't be trusted alone: charges created
  // before this field existed have no chargeType stored in MongoDB (Mongoose
  // only fills the 'BOOKING' default on read, not in the query layer), so a
  // pure ?chargeType=BOOKING filter silently drops legacy booking charges.
  // Filter by sport server-side (always reliably stored) and by chargeType
  // client-side, treating a missing chargeType as BOOKING to match the
  // backend's own documented legacy-default behavior.
  const { data: chD } = useAsync(
    () => chargesApi.list({ active: true, limit: 100, ...(form.sport ? { sport: form.sport } : {}) }),
    [form.sport]
  )
  // Charge list for the filter dropdown — decoupled from the New Booking form's
  // sport selection so every booking charge is available to filter by, not just
  // those matching whatever sport happens to be selected in the (unrelated) form.
  const { data: allChD } = useAsync(() => chargesApi.list({ active: true, limit: 200 }), [])

  const players       = pD?.data.sort((a, b) => a.name.localeCompare(b.name)) || []
  const sports        = (sD?.data || []).filter(x => x.active)
  const allCourts     = coD?.data || []
  const fCourts       = form.sport ? allCourts.filter(c => c.sport?._id === form.sport && c.active)  : []
  const fCharges      = (chD?.data || []).filter(c => !c.chargeType || c.chargeType === 'BOOKING')
  const filterCharges = (allChD?.data || []).filter(c => !c.chargeType || c.chargeType === 'BOOKING')
  const selCharge  = fCharges.find(c => c._id === form.charge)
  const selTax     = selCharge?.tax

  useEffect(() => {
    if (form.charge && !fCharges.some(c => c._id === form.charge)) p({ charge: '' })
  }, [chD]) // eslint-disable-line react-hooks/exhaustive-deps
  const base       = selCharge?.base || 0
  const taxAmt     = base * (selTax?.rate || 0) / 100
  const disc       = form.discountType === 'flat' ? +form.discount : base * (+form.discount / 100)
  const total      = base + taxAmt - disc

  function resetForm() {
    setForm({
      player:'', sport:sports[0]?._id, court: allCourts[0]?._id, charge:'',
      date: today(), timeFrom:'08:00', timeTo:'09:00',
      discount:0, discountType:'flat',
      paymentMode: 'UPI',
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
        return r.paymentMode
          ? <Badge variant={PAYMENT_MODE_COLOR[r.paymentMode] || 'default'}>{r.paymentMode}</Badge>
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
      {error && <ErrMsg msg={error} />}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18, alignItems: 'flex-end' }}>
        <select value={filters.playerId} onChange={e => changeFilter({ playerId: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Players</option>
          {players.map(pl => <option key={pl._id} value={pl._id}>{pl.name} {pl.nickname ? `(${pl.nickname})` : ""}</option>)}
        </select>
        <select value={filters.sportId} onChange={e => changeFilter({ sportId: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Sports</option>
          {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </select>
        <select value={filters.chargeId} onChange={e => changeFilter({ chargeId: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Charges</option>
          {filterCharges.map(c => <option key={c._id} value={c._id}>{c.name} — {fmt(c.base)}</option>)}
        </select>
        <select value={filters.paymentMode} onChange={e => changeFilter({ paymentMode: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Payment Modes</option>
          {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {/* <select value={filters.status} onChange={e => changeFilter({ status: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Status</option>
          {BOOKING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select> */}
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
        empty={hasActiveFilters ? 'No bookings match your filters.' : 'No bookings found.'}
      />
      {hasClientFilter ? (
        rows.length > 0 && (
          <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 16 }}>
            {rows.length} booking{rows.length !== 1 ? 's' : ''} match your filters
          </div>
        )
      ) : data?.pagination && (
        <Pagination
          page={data.pagination.page} limit={data.pagination.limit}
          totalRecords={data.pagination.totalRecords} totalPages={data.pagination.totalPages}
          hasNextPage={data.pagination.hasNextPage} hasPreviousPage={data.pagination.hasPreviousPage}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      )}

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
