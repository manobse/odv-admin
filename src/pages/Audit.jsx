import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { auditApi } from '../api/client'
import { Spinner, Badge, PageHeader } from '../components/ui'

const TYPE_ICON  = { login:'🔐', logout:'🔓', create:'✚', update:'✏', delete:'🗑', view:'👁', export:'📤' }
const TYPE_COLOR = { login:'blue', logout:'blue', create:'green', update:'amber', delete:'red', view:'accent', export:'teal' }
const MODULES    = ['Auth','Bookings','Finance','HR','Payroll','Roles','Sports','System']
const TYPES      = ['login','logout','create','update','delete','view','export']

export default function Audit() {
  const [search, setSearch] = useState('')
  const [mod,    setMod]    = useState('')
  const [type,   setType]   = useState('')

  const { data, loading, error } = useAsync(
    () => auditApi.list({ limit:80, ...(search?{search}:{}), ...(mod?{module:mod}:{}), ...(type?{type}:{}) }),
    [search, mod, type]
  )

  const logs = data?.data || []

  return (
    <div>
      <PageHeader title="Audit Logs" sub="Read-only system activity trail" />

      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20, alignItems:'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search actions, users, modules…"
          style={{ maxWidth:300 }}
        />
        <select value={mod} onChange={e => setMod(e.target.value)} style={{ width:'auto' }}>
          <option value="">All Modules</option>
          {MODULES.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)} style={{ width:'auto' }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
        <span style={{ fontSize:13, color:'var(--text3)', marginLeft:'auto' }}>{data?.total || 0} records</span>
      </div>

      {error && <div style={{ background:'var(--redD)', color:'var(--red)', border:'1px solid rgba(255,87,87,.25)', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>⚠ {error}</div>}

      {loading ? <Spinner center /> : (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)' }}>
          {logs.length === 0
            ? <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--text3)', fontSize:14 }}>No audit records found</div>
            : logs.map((log, i) => (
              <div key={log._id || i} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 20px', borderBottom: i < logs.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginTop:1 }}>
                  {TYPE_ICON[log.type] || '📋'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>{log.action}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>
                    <span style={{ marginRight:12 }}>📦 {log.module}</span>
                    <span>{new Date(log.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                    {log.ip && <span style={{ marginLeft:12 }}>🌐 {log.ip}</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <Badge variant={TYPE_COLOR[log.type] || 'default'}>{log.type}</Badge>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:5 }}>{log.userName || '—'}</div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
