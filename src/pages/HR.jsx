import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { staffApi, payrollApi } from '../api/client'
import { Btn, Badge, Tbl, Modal, FG, FRow, Spinner, PageHeader, StatCard, Avatar } from '../components/ui'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const today = () => new Date().toISOString().slice(0, 10)

/* ══════════════════════════════ STAFF ═════════════════════════════════════ */
export function Staff() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => staffApi.list({ limit: 100 }))
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState({ name:'', role:'', department:'', phone:'', email:'', salary:'', salaryType:'Monthly', joinDate: today(), active:true })
  const [saving, setSaving] = useState(false)
  const p = f => setForm(prev => ({ ...prev, ...f }))

  async function save() {
    if (!form.name || !form.role || !form.phone) { toast('Name, role & phone required', 'error'); return }
    setSaving(true)
    try {
      const body = { ...form, salary: +form.salary }
      if (modal === 'add') await staffApi.create(body)
      else await staffApi.update(form._id, body)
      toast('Saved', 'success'); reload(); setModal(null)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function toggle(m) {
    try { await staffApi.toggle(m._id); reload() }
    catch (e) { toast(e.message, 'error') }
  }

  const members = data?.data || []

  return (
    <div>
      <PageHeader title="Staff" sub="Employee management"
        action={<Btn size="sm" onClick={() => { setForm({ name:'', role:'', department:'', phone:'', email:'', salary:'', salaryType:'Monthly', joinDate: today(), active:true }); setModal('add') }}>＋ Add Staff</Btn>}
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:18 }}>
        <StatCard label="Total Staff"   value={members.length} />
        <StatCard label="Active"        value={members.filter(m => m.active).length} color="var(--green)" />
        <StatCard label="Monthly Cost"  value={fmt(members.filter(m => m.active && m.salaryType === 'Monthly').reduce((a, b) => a + b.salary, 0))} color="var(--amber)" />
      </div>

      {loading ? <Spinner center /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:16 }}>
          {members.map(m => (
            <div key={m._id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:20 }}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:14 }}>
                <Avatar name={m.name} size={46} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--ffH)', fontWeight:700, fontSize:16, marginBottom:2 }}>{m.name}</div>
                  <div style={{ fontSize:13, color:'var(--text2)' }}>{m.role} · {m.department}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.email || m.phone}</div>
                </div>
                <Badge variant={m.active ? 'green' : 'red'}>{m.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>Salary</div>
                  <div style={{ fontWeight:700, color:'var(--green)' }}>{fmt(m.salary)}<span style={{ fontSize:11, fontWeight:400, color:'var(--text3)' }}>/{m.salaryType}</span></div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>Phone</div>
                  <div style={{ fontSize:13 }}>{m.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>Joined</div>
                  <div style={{ fontSize:12 }}>{m.joinDate || '—'}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Btn variant="ghost" size="xs" onClick={() => { setForm({ ...m, salary: String(m.salary) }); setModal('edit') }}>Edit</Btn>
                <Btn variant="ghost" size="xs" onClick={() => toggle(m)}>{m.active ? 'Deactivate' : 'Activate'}</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Staff Member' : 'Edit Staff Member'} onClose={() => setModal(null)}
          footer={<><Btn variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Btn><Btn size="sm" loading={saving} onClick={save}>Save</Btn></>}>
          <FG label="Full Name"><input value={form.name} onChange={e => p({ name: e.target.value })} placeholder="Staff name" autoFocus /></FG>
          <FRow>
            <FG label="Role / Designation"><input value={form.role} onChange={e => p({ role: e.target.value })} placeholder="e.g. Coach" /></FG>
            <FG label="Department"><input value={form.department} onChange={e => p({ department: e.target.value })} placeholder="e.g. Admin" /></FG>
          </FRow>
          <FRow>
            <FG label="Phone *"><input value={form.phone} onChange={e => p({ phone: e.target.value })} placeholder="Mobile" /></FG>
            <FG label="Email"><input value={form.email} onChange={e => p({ email: e.target.value })} placeholder="Email" /></FG>
          </FRow>
          <FRow>
            <FG label="Salary (₹)"><input type="number" value={form.salary} onChange={e => p({ salary: e.target.value })} /></FG>
            <FG label="Type">
              <select value={form.salaryType} onChange={e => p({ salaryType: e.target.value })}>
                <option>Monthly</option><option>Hourly</option>
              </select>
            </FG>
          </FRow>
          <FG label="Join Date"><input type="date" value={form.joinDate} onChange={e => p({ joinDate: e.target.value })} /></FG>
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════ PAYROLL ═══════════════════════════════════ */
export function Payroll() {
  const toast = useToast()
  const { data, loading, reload } = useAsync(() => payrollApi.list({ limit: 100 }))
  const [payslip,    setPayslip]    = useState(null)
  const [payingId,   setPayingId]   = useState(null)
  const [slipLoad,   setSlipLoad]   = useState(false)

  const all    = data?.data || []
  const unpaid = all.filter(p => p.status === 'Unpaid')
  const paid   = all.filter(p => p.status === 'Paid')

  async function markPaid(id) {
    setPayingId(id)
    try { await payrollApi.pay(id); toast('Payment recorded — expense auto-created', 'success'); reload() }
    catch (e) { toast(e.message, 'error') }
    finally { setPayingId(null) }
  }

  async function viewSlip(id) {
    setSlipLoad(true)
    try { const r = await payrollApi.payslip(id); setPayslip(r) }
    catch (e) { toast(e.message, 'error') }
    finally { setSlipLoad(false) }
  }

  async function bulkGenerate() {
    const month = prompt('Enter month (e.g. April 2025):')
    if (!month) return
    const parts = month.trim().split(' ')
    const names = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' }
    const monthYear = `${parts[1]}-${names[parts[0]] || '01'}`
    try {
      const r = await payrollApi.bulkGen({ month, monthYear })
      toast(`Generated ${r.generated} payroll records`, 'success'); reload()
    } catch (e) { toast(e.message, 'error') }
  }

  const unpaidCols = [
    { key:'staff', label:'Staff', render: r => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <Avatar name={r.staff?.name || '?'} bg="var(--amberD)" color="var(--amber)" size={32} />
        <div><div style={{ fontWeight:500 }}>{r.staff?.name}</div><div style={{ fontSize:12, color:'var(--text3)' }}>{r.staff?.role}</div></div>
      </div>
    )},
    { key:'month',       label:'Month',      render: r => <span style={{ fontSize:13 }}>{r.month}</span> },
    { key:'grossSalary', label:'Gross',      render: r => fmt(r.grossSalary) },
    { key:'deductions',  label:'Deductions', render: r => <span style={{ color:'var(--red)' }}>− {fmt(r.deductions)}</span> },
    { key:'netPay',      label:'Net Pay',    render: r => <strong style={{ color:'var(--accent)' }}>{fmt(r.netPay)}</strong> },
    { key:'actions',     label:'',           render: r => (
      <div style={{ display:'flex', gap:6 }}>
        <Btn variant="success" size="xs" loading={payingId === r._id} onClick={() => markPaid(r._id)}>Mark Paid</Btn>
        <Btn variant="ghost"   size="xs" onClick={() => viewSlip(r._id)}>Payslip</Btn>
      </div>
    )},
  ]

  const paidCols = [
    { key:'staff',  label:'Staff',   render: r => <strong>{r.staff?.name}</strong> },
    { key:'month',  label:'Month',   render: r => <span style={{ fontSize:13 }}>{r.month}</span> },
    { key:'netPay', label:'Net Pay', render: r => <strong style={{ color:'var(--green)' }}>{fmt(r.netPay)}</strong> },
    { key:'paidOn', label:'Paid On', render: r => <span style={{ fontSize:12, color:'var(--text3)' }}>{r.paidOn?.slice(0,10) || '—'}</span> },
    { key:'slip',   label:'',        render: r => <Btn variant="ghost" size="xs" onClick={() => viewSlip(r._id)}>Payslip</Btn> },
  ]

  return (
    <div>
      <PageHeader title="Payroll" sub="Staff salary management"
        action={<Btn variant="ghost" size="sm" onClick={bulkGenerate}>⚡ Bulk Generate</Btn>}
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14, marginBottom:20 }}>
        <StatCard label="Pending Payroll" value={fmt(unpaid.reduce((a,b) => a+b.netPay, 0))} color="var(--amber)" />
        <StatCard label="Total Paid"      value={fmt(paid.reduce((a,b) => a+b.netPay, 0))}   color="var(--green)" />
        <StatCard label="Pending Count"   value={unpaid.length} />
        <StatCard label="Staff Members"   value={[...new Set(all.map(p => p.staff?._id))].filter(Boolean).length} />
      </div>

      {loading ? <Spinner center /> : <>
        {unpaid.length > 0 && <>
          <div style={{ fontFamily:'var(--ffH)', fontWeight:600, fontSize:15, color:'var(--amber)', marginBottom:10 }}>⏳ Pending Payment ({unpaid.length})</div>
          <div style={{ marginBottom:22 }}><Tbl cols={unpaidCols} rows={unpaid} /></div>
        </>}
        <div style={{ fontFamily:'var(--ffH)', fontWeight:600, fontSize:15, marginBottom:10 }}>✅ Payment History</div>
        <Tbl cols={paidCols} rows={paid} empty="No payments recorded yet" />
      </>}

      {slipLoad && <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}><Spinner size={36} /></div>}

      {payslip && (
        <Modal title="Payslip" onClose={() => setPayslip(null)} wide
          footer={<><Btn variant="ghost" size="sm" onClick={() => setPayslip(null)}>Close</Btn><Btn size="sm" onClick={() => window.print()}>🖨 Print</Btn></>}>
          <PayslipView payroll={payslip.data} club={payslip.club} />
        </Modal>
      )}
    </div>
  )
}

function PayslipView({ payroll: p, club }) {
  if (!p) return null
  return (
    <div style={{ background:'#fff', color:'#111', borderRadius:12, padding:28, fontSize:13 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--ffH)', fontSize:22, fontWeight:800 }}>⚡ {club?.name || 'SportsPlex'}</div>
          <div style={{ fontSize:11, color:'#666', marginTop:3, lineHeight:1.8 }}>{club?.address}<br />GSTIN: {club?.gstin}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--ffH)', fontSize:17, fontWeight:700, marginBottom:4 }}>PAYSLIP</div>
          <div style={{ fontSize:12, color:'#666' }}>Ref: {p.payrollId}</div>
          <span style={{ display:'inline-block', marginTop:6, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: p.status === 'Paid' ? '#dcfce7' : '#fef3c7', color: p.status === 'Paid' ? '#16a34a' : '#d97706' }}>{p.status}</span>
        </div>
      </div>
      <div style={{ background:'#f5f5f5', padding:'12px 16px', borderRadius:8, marginBottom:18 }}>
        <div style={{ fontWeight:700, fontSize:16 }}>{p.staff?.name}</div>
        <div style={{ color:'#666', fontSize:13, marginTop:3 }}>{p.staff?.role} · {p.staff?.department}</div>
        <div style={{ color:'#999', fontSize:12, marginTop:3 }}>{p.month}</div>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
        <tbody>
          <tr style={{ borderBottom:'1px solid #eee' }}><td style={{ padding:'9px 0', color:'#555' }}>Gross Salary</td><td style={{ textAlign:'right', padding:'9px 0', fontWeight:600 }}>₹{p.grossSalary?.toLocaleString()}</td></tr>
          <tr style={{ borderBottom:'1px solid #eee' }}><td style={{ padding:'9px 0', color:'#555' }}>Deductions</td><td style={{ textAlign:'right', padding:'9px 0', color:'#dc2626' }}>− ₹{p.deductions?.toLocaleString()}</td></tr>
          {p.deductionNotes && <tr><td colSpan="2" style={{ padding:'4px 0 8px', fontSize:12, color:'#999' }}>{p.deductionNotes}</td></tr>}
          <tr style={{ borderTop:'2px solid #111' }}>
            <td style={{ padding:'14px 0', fontWeight:700, fontSize:16 }}>Net Pay</td>
            <td style={{ textAlign:'right', padding:'14px 0', fontWeight:800, fontSize:22 }}>₹{p.netPay?.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      {p.paidOn && <div style={{ marginTop:16, padding:'10px 14px', background:'#f0fff4', borderRadius:8, fontSize:12, color:'#16a34a' }}>✓ Paid on {p.paidOn?.slice(0,10)}</div>}
      <div style={{ marginTop:16, textAlign:'center', fontSize:11, color:'#aaa' }}>This is a computer-generated payslip and does not require a signature.</div>
    </div>
  )
}
