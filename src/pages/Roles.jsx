import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { rolesApi } from '../api/client'
import { Btn, Spinner, PageHeader, Modal, FG } from '../components/ui'

const ALL_PERMS = [
  { key:'sports',     label:'Sports Management',   icon:'🏅' },
  { key:'courts',     label:'Courts / Grounds',     icon:'🏟' },
  { key:'charges',    label:'Charges & Pricing',    icon:'⚡' },
  { key:'taxes',      label:'Tax Management',       icon:'📋' },
  { key:'bookings',   label:'Slot Booking',         icon:'📅' },
  { key:'income',     label:'Income Entry',         icon:'📈' },
  { key:'expenses',   label:'Expense Entry',        icon:'📉' },
  { key:'categories', label:'Category Management',  icon:'🗂' },
  { key:'staff',      label:'Staff Management',     icon:'👥' },
  { key:'payroll',    label:'Payroll Management',   icon:'💵' },
  { key:'payslips',   label:'Payslip Access',       icon:'🧾' },
  { key:'reports',    label:'Reports Access',       icon:'📊' },
  { key:'audit',      label:'Audit Logs',           icon:'📜' },
  { key:'roles',      label:'Roles & Permissions',  icon:'🔑' },
]

export default function Roles() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => rolesApi.list({ limit: 50 }))
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState({ name:'', permissions:[] })
  const [saving, setSaving] = useState(false)

  const toggle = key => setForm(p => ({
    ...p,
    permissions: p.permissions.includes(key)
      ? p.permissions.filter(x => x !== key)
      : [...p.permissions, key],
  }))

  const selectAll   = () => setForm(p => ({ ...p, permissions: ALL_PERMS.map(x => x.key) }))
  const deselectAll = () => setForm(p => ({ ...p, permissions: [] }))

  async function save() {
    if (!form.name) { toast('Role name required', 'error'); return }
    setSaving(true)
    try {
      if (modal === 'add') await rolesApi.create(form)
      else await rolesApi.update(form._id, form)
      toast('Role saved', 'success'); reload(); setModal(null)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this role?')) return
    try { await rolesApi.del(id); toast('Deleted', 'success'); reload() }
    catch (e) { toast(e.message, 'error') }
  }

  const roles = data?.data || []

  return (
    <div>
      <PageHeader title="Roles & Permissions" sub="Dynamic role-based access control"
        action={<Btn size="sm" onClick={() => { setForm({ name:'', permissions:[] }); setModal('add') }}>＋ Add Role</Btn>}
      />

      {loading ? <Spinner center /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {roles.map(role => (
            <div key={role._id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:'var(--ffH)', fontSize:17, fontWeight:700 }}>{role.name}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:3, display:'flex', alignItems:'center', gap:6 }}>
                    {role.permissions?.length} permissions
                    {role.isSystem && <span style={{ background:'var(--accentD)', color:'var(--accent)', padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:600 }}>SYSTEM</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Btn variant="ghost" size="xs" onClick={() => { setForm({ ...role }); setModal('edit') }} style={{ padding:'5px 9px' }}>✏ Edit</Btn>
                  {!role.isSystem && <Btn variant="danger" size="xs" onClick={() => del(role._id)} style={{ padding:'5px 9px' }}>🗑</Btn>}
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {role.permissions?.slice(0, 8).map(p => {
                  const pd = ALL_PERMS.find(x => x.key === p)
                  return (
                    <span key={p} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:40, fontSize:12 }}>
                      {pd?.icon} {pd?.label}
                    </span>
                  )
                })}
                {(role.permissions?.length || 0) > 8 && (
                  <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', background:'var(--accentD)', color:'var(--accent)', borderRadius:40, fontSize:12 }}>
                    +{role.permissions.length - 8} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Role' : `Edit Role: ${form.name}`}
          onClose={() => setModal(null)}
          wide
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Save Role</Btn></>}
        >
          <FG label="Role Name">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Manager, Coach, Front Desk…" autoFocus />
          </FG>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>Permissions</label>
              <div style={{ display:'flex', gap:8 }}>
                <Btn variant="ghost" size="xs" onClick={selectAll}>Select All</Btn>
                <Btn variant="ghost" size="xs" onClick={deselectAll}>Clear</Btn>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
              {ALL_PERMS.map(p => {
                const checked = form.permissions.includes(p.key)
                return (
                  <div key={p.key} onClick={() => toggle(p.key)}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', border:`1.5px solid ${checked ? 'var(--accent)' : 'var(--border2)'}`, background: checked ? 'var(--accentD)' : 'transparent', borderRadius:'var(--r)', cursor:'pointer', transition:'all .15s', fontSize:13 }}>
                    <div style={{ width:17, height:17, borderRadius:4, border:`2px solid ${checked ? 'var(--accent)' : 'var(--border2)'}`, background: checked ? 'var(--accent)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, flexShrink:0, transition:'all .15s' }}>
                      {checked && '✓'}
                    </div>
                    <span>{p.icon} {p.label}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop:10, fontSize:12, color:'var(--text3)' }}>
              {form.permissions.length} of {ALL_PERMS.length} permissions selected
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
