import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { sportsApi, courtsApi, taxesApi, chargesApi } from '../api/client'
import { Btn, Badge, Tbl, Modal, FG, FRow, Toggle, Spinner, PageHeader, InfoBox } from '../components/ui'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const COLORS = ['#22d26e','#7c6fff','#ffb547','#ff5757','#47a3ff','#2dd4bf','#ec4899','#f97316']

/* ══════════════════════════════ SPORTS ════════════════════════════════════ */
export function Sports() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => sportsApi.list({ limit: 50 }))
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState({ name:'', icon:'🏅', color:'#7c6fff', active:true })
  const [saving, setSaving] = useState(false)
  const p = f => setForm(prev => ({ ...prev, ...f }))

  async function save() {
    if (!form.name) { toast('Name is required', 'error'); return }
    setSaving(true)
    try {
      if (modal === 'add') await sportsApi.create(form)
      else await sportsApi.update(form._id, form)
      toast(modal === 'add' ? 'Sport added' : 'Sport updated', 'success')
      reload(); setModal(null)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function toggleActive(s) {
    try {
      await sportsApi.update(s._id, { active: !s.active })
      toast(s.active ? 'Sport deactivated' : 'Sport activated', 'success')
      reload()
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <div>
      <PageHeader title="Sports" sub="Manage all sports offered by the club"
        action={<Btn size="sm" onClick={() => { setForm({ name:'', icon:'🏅', color:'#7c6fff', active:true }); setModal('add') }}>＋ Add Sport</Btn>}
      />
      {loading ? <Spinner center /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:16 }}>
          {data?.data?.map(s => (
            <div key={s._id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderTop:`3px solid ${s.color || 'var(--accent)'}`, borderRadius:'var(--r2)', padding:20, transition:'box-shadow .2s,transform .2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow)'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontSize:34 }}>{s.icon}</span>
                <Badge variant={s.active ? 'green' : 'red'}>{s.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div style={{ fontFamily:'var(--ffH)', fontSize:18, fontWeight:700, marginBottom:14 }}>{s.name}</div>
              <div style={{ display:'flex', gap:8 }}>
                <Btn variant="ghost" size="xs" onClick={() => { setForm({ ...s }); setModal('edit') }}>Edit</Btn>
                <Btn variant="ghost" size="xs" onClick={() => toggleActive(s)}>{s.active ? 'Deactivate' : 'Activate'}</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Sport' : 'Edit Sport'} onClose={() => setModal(null)}
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Save</Btn></>}>
          <FG label="Sport Name"><input value={form.name} onChange={e => p({ name: e.target.value })} placeholder="e.g. Cricket" autoFocus /></FG>
          <FRow>
            <FG label="Icon (Emoji)"><input value={form.icon} onChange={e => p({ icon: e.target.value })} /></FG>
            <FG label="Color">
              <div style={{ display:'flex', gap:7, flexWrap:'wrap', paddingTop:4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => p({ color: c })}
                    style={{ width:26, height:26, background:c, borderRadius:6, cursor:'pointer',
                      border: form.color === c ? '2.5px solid white' : '2.5px solid transparent',
                      boxShadow: form.color === c ? `0 0 0 2px ${c}` : '',
                      transition:'transform .15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
                ))}
              </div>
            </FG>
          </FRow>
          <FG label="Status">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Toggle on={form.active} onClick={() => p({ active: !form.active })} />
              <span style={{ fontSize:13, color:'var(--text2)' }}>{form.active ? 'Active' : 'Inactive'}</span>
            </div>
          </FG>
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════ COURTS ════════════════════════════════════ */
export function Courts() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => courtsApi.list({ limit: 100 }))
  const { data: sD } = useAsync(() => sportsApi.list({ limit: 50 }))
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState({ name:'', sport:'', desc:'', active:true })
  const [saving, setSaving] = useState(false)
  const [fs, setFs] = useState('')
  const sports = sD?.data || []
  const rows   = (data?.data || []).filter(c => !fs || c.sport?._id === fs)
  const p = f => setForm(prev => ({ ...prev, ...f }))

  async function save() {
    if (!form.name || !form.sport) { toast('Name & sport required', 'error'); return }
    setSaving(true)
    try {
      if (modal === 'add') await courtsApi.create(form)
      else await courtsApi.update(form._id, form)
      toast('Saved', 'success'); reload(); setModal(null)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const cols = [
    { key:'name',   label:'Court',       render: r => <strong>{r.name}</strong> },
    { key:'sport',  label:'Sport',       render: r => <span style={{ color: r.sport?.color, fontSize:13 }}>{r.sport?.icon} {r.sport?.name}</span> },
    { key:'desc',   label:'Description', render: r => <span style={{ color:'var(--text3)', fontSize:13 }}>{r.desc || '—'}</span> },
    { key:'active', label:'Status',      render: r => <Badge variant={r.active ? 'green' : 'red'}>{r.active ? 'Active' : 'Inactive'}</Badge> },
    { key:'actions',label:'',            render: r => (
      <div style={{ display:'flex', gap:6 }}>
        <Btn variant="ghost" size="xs" onClick={() => { setForm({ ...r, sport: r.sport?._id || r.sport }); setModal('edit') }}>Edit</Btn>
        <Btn variant="ghost" size="xs" onClick={async () => {
          try { await courtsApi.update(r._id, { active: !r.active }); reload() }
          catch (e) { toast(e.message, 'error') }
        }}>{r.active ? 'Deactivate' : 'Activate'}</Btn>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Courts & Grounds" sub="Multiple courts per sport"
        action={<Btn size="sm" onClick={() => { setForm({ name:'', sport: sports[0]?._id || '', desc:'', active:true }); setModal('add') }}>＋ Add Court</Btn>}
      />
      <div style={{ marginBottom:18 }}>
        <select value={fs} onChange={e => setFs(e.target.value)} style={{ width:'auto' }}>
          <option value="">All Sports</option>
          {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </select>
      </div>
      <Tbl cols={cols} rows={rows} loading={loading} />

      {modal && (
        <Modal title={modal === 'add' ? 'Add Court' : 'Edit Court'} onClose={() => setModal(null)}
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Save</Btn></>}>
          <FG label="Court Name"><input value={form.name} onChange={e => p({ name: e.target.value })} placeholder="e.g. Court 1" autoFocus /></FG>
          <FG label="Sport">
            <select value={form.sport} onChange={e => p({ sport: e.target.value })}>
              <option value="">Select sport…</option>
              {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
            </select>
          </FG>
          <FG label="Description"><input value={form.desc} onChange={e => p({ desc: e.target.value })} placeholder="Optional description" /></FG>
          <FG label="Status">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Toggle on={form.active} onClick={() => p({ active: !form.active })} />
              <span style={{ fontSize:13, color:'var(--text2)' }}>{form.active ? 'Active' : 'Inactive'}</span>
            </div>
          </FG>
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════ TAXES ═════════════════════════════════════ */
export function Taxes() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => taxesApi.list({ limit: 50 }))
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState({ name:'', rate:'', active:true })
  const [saving, setSaving] = useState(false)
  const p = f => setForm(prev => ({ ...prev, ...f }))

  async function save() {
    if (!form.name || !form.rate) { toast('Fill all fields', 'error'); return }
    setSaving(true)
    try {
      if (modal === 'add') await taxesApi.create({ ...form, rate: +form.rate })
      else await taxesApi.update(form._id, { ...form, rate: +form.rate })
      toast('Saved', 'success'); reload(); setModal(null)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function del(id) {
    try { await taxesApi.del(id); toast('Deleted', 'success'); reload() }
    catch (e) { toast(e.message, 'error') }
  }

  return (
    <div>
      <PageHeader title="Tax Management" sub="GST & tax slabs"
        action={<Btn size="sm" onClick={() => { setForm({ name:'', rate:'', active:true }); setModal('add') }}>＋ Add Tax</Btn>}
      />
      {loading ? <Spinner center /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
          {data?.data?.map(t => (
            <div key={t._id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <Badge variant={t.active ? 'green' : 'red'}>{t.active ? 'Active' : 'Inactive'}</Badge>
                <div style={{ display:'flex', gap:6 }}>
                  <Btn variant="ghost" size="xs" onClick={() => { setForm({ ...t, rate: String(t.rate) }); setModal('edit') }} style={{ padding:'4px 8px' }}>✏</Btn>
                  <Btn variant="danger" size="xs" onClick={() => del(t._id)} style={{ padding:'4px 8px' }}>🗑</Btn>
                </div>
              </div>
              <div style={{ fontFamily:'var(--ffH)', fontSize:30, fontWeight:800, color:'var(--accent)' }}>{t.rate}%</div>
              <div style={{ fontWeight:600, marginTop:4, fontSize:15 }}>{t.name}</div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Tax' : 'Edit Tax'} onClose={() => setModal(null)}
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Save</Btn></>}>
          <FG label="Tax Name"><input value={form.name} onChange={e => p({ name: e.target.value })} placeholder="e.g. GST 18%" autoFocus /></FG>
          <FG label="Rate (%)"><input type="number" value={form.rate} onChange={e => p({ rate: e.target.value })} placeholder="18" /></FG>
          <FG label="Status">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Toggle on={form.active} onClick={() => p({ active: !form.active })} />
              <span style={{ fontSize:13, color:'var(--text2)' }}>{form.active ? 'Active' : 'Inactive'}</span>
            </div>
          </FG>
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════ CHARGES ═══════════════════════════════════ */
export function Charges() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => chargesApi.list({ limit: 100 }))
  const { data: sD } = useAsync(() => sportsApi.list({ limit: 50 }))
  const { data: tD } = useAsync(() => taxesApi.list({ limit: 50 }))
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState({ name:'', sport:'', type:'Hourly', base:'', tax:'', active:true })
  const [saving, setSaving] = useState(false)
  const [fs, setFs] = useState('')
  const sports  = sD?.data || []
  const taxes   = (tD?.data || []).filter(t => t.active)
  const rows    = (data?.data || []).filter(c => !fs || c.sport?._id === fs)
  const selTax  = taxes.find(t => t._id === form.tax)
  const finalPrice = form.base && selTax ? +form.base * (1 + selTax.rate / 100) : 0
  const TYPES = ['Hourly','Coaching','Monthly','Yearly','Weekend']
  const p = f => setForm(prev => ({ ...prev, ...f }))

  async function save() {
    if (!form.name || !form.sport || !form.base || !form.tax) { toast('Fill all fields', 'error'); return }
    setSaving(true)
    try {
      const body = { ...form, base: +form.base }
      if (modal === 'add') await chargesApi.create(body)
      else await chargesApi.update(form._id, body)
      toast('Saved', 'success'); reload(); setModal(null)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const cols = [
    { key:'name',   label:'Charge', render: r => <strong>{r.name}</strong> },
    { key:'sport',  label:'Sport',  render: r => <span style={{ color: r.sport?.color, fontSize:13 }}>{r.sport?.icon} {r.sport?.name}</span> },
    { key:'type',   label:'Type',   render: r => <span style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:40, padding:'3px 10px', fontSize:12 }}>{r.type}</span> },
    { key:'base',   label:'Base',   render: r => fmt(r.base) },
    { key:'tax',    label:'Tax',    render: r => <span style={{ fontSize:12, color:'var(--text3)' }}>{r.tax?.name || '—'}</span> },
    { key:'final',  label:'Final Price', render: r => <strong style={{ color:'var(--green)' }}>{fmt(r.base * (1 + (r.tax?.rate || 0) / 100))}</strong> },
    { key:'active', label:'Status', render: r => <Badge variant={r.active ? 'green' : 'red'}>{r.active ? 'Active' : 'Off'}</Badge> },
    { key:'actions',label:'', render: r => (
      <Btn variant="ghost" size="xs" onClick={() => { setForm({ ...r, sport: r.sport?._id, tax: r.tax?._id, base: String(r.base) }); setModal('edit') }}>Edit</Btn>
    )},
  ]

  return (
    <div>
      <PageHeader title="Charges & Pricing" sub="Sport-specific pricing options"
        action={<Btn size="sm" onClick={() => { setForm({ name:'', sport: sports[0]?._id || '', type:'Hourly', base:'', tax: taxes[0]?._id || '', active:true }); setModal('add') }}>＋ Add Charge</Btn>}
      />
      <div style={{ marginBottom:18 }}>
        <select value={fs} onChange={e => setFs(e.target.value)} style={{ width:'auto' }}>
          <option value="">All Sports</option>
          {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </select>
      </div>
      <Tbl cols={cols} rows={rows} loading={loading} />

      {modal && (
        <Modal title={modal === 'add' ? 'Add Charge' : 'Edit Charge'} onClose={() => setModal(null)}
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Save</Btn></>}>
          <FRow>
            <FG label="Sport">
              <select value={form.sport} onChange={e => p({ sport: e.target.value })}>
                <option value="">Select…</option>
                {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
              </select>
            </FG>
            <FG label="Type">
              <select value={form.type} onChange={e => p({ type: e.target.value })}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </FG>
          </FRow>
          <FG label="Charge Name"><input value={form.name} onChange={e => p({ name: e.target.value })} placeholder="e.g. Hourly Rate" autoFocus /></FG>
          <FRow>
            <FG label="Base Price (₹)"><input type="number" value={form.base} onChange={e => p({ base: e.target.value })} min="0" /></FG>
            <FG label="Tax Slab">
              <select value={form.tax} onChange={e => p({ tax: e.target.value })}>
                <option value="">Select…</option>
                {taxes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </FG>
          </FRow>
          {finalPrice > 0 && (
            <InfoBox>Final price: <strong style={{ color:'var(--accent)' }}>{fmt(finalPrice)}</strong> (incl. {selTax?.rate}% tax)</InfoBox>
          )}
        </Modal>
      )}
    </div>
  )
}
