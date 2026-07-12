// ─────────────────────────────────────────────────────────────────────────────
// ui.jsx  —  All shared UI components.
// Pure inline styles only. Zero external dependencies. Dark/light via CSS vars.
// ─────────────────────────────────────────────────────────────────────────────

// ── Btn ───────────────────────────────────────────────────────────────────────
const BTN_BASE = {
  display:'inline-flex', alignItems:'center', gap:7,
  fontFamily:'var(--ff)', fontWeight:500, borderRadius:'var(--r)',
  transition:'all .15s', border:'none', cursor:'pointer', whiteSpace:'nowrap',
}
const BTN_VARIANTS = {
  primary: { background:'var(--ac)', color:'#fff', boxShadow:'0 2px 12px var(--acG)' },
  ghost:   { background:'transparent', color:'var(--tx2)', border:'1.5px solid var(--brd2)' },
  danger:  { background:'var(--rdD)', color:'var(--rd)', border:'1.5px solid rgba(255,87,87,.25)' },
  success: { background:'var(--grD)', color:'var(--gr)', border:'1.5px solid rgba(34,210,110,.25)' },
}
const BTN_SIZES = {
  xs:{ padding:'5px 10px', fontSize:12 },
  sm:{ padding:'7px 14px', fontSize:13 },
  md:{ padding:'10px 20px', fontSize:14 },
  lg:{ padding:'13px 26px', fontSize:15 },
}

export function Btn({ children, variant='primary', size='md', loading=false, style={}, onClick, type='button', disabled }) {
  const isDisabled = loading || disabled
  const spin = loading ? <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,.35)', borderTopColor:'currentColor', borderRadius:'50%', animation:'spin .6s linear infinite', display:'inline-block', flexShrink:0 }}/> : null
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      style={{ ...BTN_BASE, ...BTN_VARIANTS[variant], ...BTN_SIZES[size], opacity:isDisabled?.5:1, cursor:isDisabled?'not-allowed':'pointer', ...style }}
    >
      {spin}{children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  green:  { background:'var(--grD)',  color:'var(--gr)' },
  red:    { background:'var(--rdD)',  color:'var(--rd)' },
  amber:  { background:'var(--amD)', color:'var(--am)' },
  blue:   { background:'var(--blD)', color:'var(--bl)' },
  accent: { background:'var(--acD)', color:'var(--ac)' },
  teal:   { background:'var(--tlD)', color:'var(--tl)' },
  default:{ background:'var(--surf3)',color:'var(--tx2)' },
}

export function Badge({ children, variant='default' }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:40, fontSize:12, fontWeight:500, ...(BADGE_STYLES[variant]||BADGE_STYLES.default) }}>
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style={} }) {
  return (
    <div style={{ background:'var(--surf)', border:'1px solid var(--brd)', borderRadius:'var(--r2)', padding:20, ...style }}>
      {children}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color, change, dir }) {
  return (
    <div style={{ background:'var(--surf)', border:'1px solid var(--brd)', borderRadius:'var(--r2)', padding:'18px 20px', animation:'fadeUp .3s ease both' }}>
      <div style={{ fontSize:13, color:'var(--tx3)', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:'var(--ffH)', fontSize:26, fontWeight:700, color:color||'var(--tx)', marginBottom:4 }}>{value}</div>
      {change && <div style={{ fontSize:12, fontWeight:500, color:dir==='up'?'var(--gr)':'var(--rd)' }}>{dir==='up'?'↑':'↓'} {change}</div>}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size=22, center=false }) {
  const el = <span style={{ width:size, height:size, border:'2.5px solid var(--brd2)', borderTopColor:'var(--ac)', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block', flexShrink:0 }}/>
  return center ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>{el}</div> : el
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, wide=false }) {
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.72)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'48px 16px 80px', overflowY:'auto', animation:'fadeUp .15s ease' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'var(--surf)', border:'1px solid var(--brd2)', borderRadius:'var(--r3)', width:'100%', maxWidth:wide?760:540, boxShadow:'var(--shL)', animation:'modalIn .2s ease' }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--brd)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontFamily:'var(--ffH)', fontSize:17, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', color:'var(--tx3)', padding:6, borderRadius:6, fontSize:18, lineHeight:1, display:'flex', alignItems:'center', transition:'all .15s' }}>✕</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
        {footer && <div style={{ padding:'16px 24px', borderTop:'1px solid var(--brd)', display:'flex', gap:10, justifyContent:'flex-end' }}>{footer}</div>}
      </div>
    </div>
  )
}

// ── Form helpers ──────────────────────────────────────────────────────────────
export function FG({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
      {label && <label style={{ fontSize:13, fontWeight:500, color:'var(--tx2)' }}>{label}</label>}
      {children}
    </div>
  )
}

export function FRow({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>{children}</div>
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ on, onClick }) {
  return (
    <div
      onClick={onClick}
      role="switch"
      aria-checked={on}
      style={{ width:40, height:22, background:on?'var(--ac)':'var(--surf3)', border:`1px solid ${on?'var(--ac)':'var(--brd2)'}`, borderRadius:11, position:'relative', cursor:'pointer', transition:'background .2s, border-color .2s', flexShrink:0 }}
    >
      <div style={{ position:'absolute', width:16, height:16, background:'#fff', borderRadius:'50%', top:2, left:on?22:2, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.3)' }}/>
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Tbl({ cols, rows=[], loading=false, empty='No records found' }) {
  return (
    <div style={{ background:'var(--surf)', border:'1px solid var(--brd)', borderRadius:'var(--r2)', overflow:'hidden' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} style={{ textAlign:'left', padding:'10px 16px', background:'var(--surf2)', color:'var(--tx3)', fontSize:11.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length:5 }).map((_, i) => (
                  <tr key={i}>
                    {cols.map(c => (
                      <td key={c.key} style={{ padding:'13px 16px', borderTop:'1px solid var(--brd)' }}>
                        <div style={{ height:13, width:'70%', borderRadius:4, background:'linear-gradient(90deg,var(--surf2) 25%,var(--surf3) 50%,var(--surf2) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }}/>
                      </td>
                    ))}
                  </tr>
                ))
              : rows.length === 0
                ? <tr><td colSpan={cols.length} style={{ textAlign:'center', padding:'40px 16px', color:'var(--tx3)', fontSize:14 }}>{empty}</td></tr>
                : rows.map((row, i) => (
                    <tr key={row._id || i}>
                      {cols.map(c => (
                        <td key={c.key} style={{ padding:'12px 16px', borderTop:'1px solid var(--brd)', verticalAlign:'middle' }}>
                          {c.render ? c.render(row) : (row[c.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
      <div>
        <h2 style={{ fontFamily:'var(--ffH)', fontSize:20, fontWeight:700, marginBottom:2 }}>{title}</h2>
        {sub && <p style={{ fontSize:13, color:'var(--tx3)' }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:2, borderBottom:'1.5px solid var(--brd)', marginBottom:20, overflowX:'auto' }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding:'9px 18px', fontSize:13.5, fontWeight:500,
            background:'none', border:'none',
            borderBottom: active===t.key ? '2.5px solid var(--ac)' : '2.5px solid transparent',
            color: active===t.key ? 'var(--ac)' : 'var(--tx3)',
            marginBottom:-1.5, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── InfoBox ───────────────────────────────────────────────────────────────────
const INFO_STYLES = {
  accent: { background:'var(--acD)', border:'1px solid rgba(124,111,255,.2)' },
  green:  { background:'var(--grD)', border:'1px solid rgba(34,210,110,.2)' },
  amber:  { background:'var(--amD)', border:'1px solid rgba(255,181,71,.2)' },
  red:    { background:'var(--rdD)', border:'1px solid rgba(255,87,87,.2)' },
}

export function InfoBox({ children, variant='accent' }) {
  return (
    <div style={{ ...(INFO_STYLES[variant]||INFO_STYLES.accent), borderRadius:'var(--r)', padding:'12px 16px', fontSize:13, marginBottom:14, lineHeight:1.7 }}>
      {children}
    </div>
  )
}

// ── ErrMsg ────────────────────────────────────────────────────────────────────
export function ErrMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background:'var(--rdD)', color:'var(--rd)', border:'1px solid rgba(255,87,87,.25)', borderRadius:'var(--r)', padding:'10px 14px', fontSize:13, marginBottom:14 }}>
      ⚠ {msg}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name='?', size=32, bg='var(--accentD)', color='var(--accent)' }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size*0.4, flexShrink:0 }}>
      {(name?.[0] || '?').toUpperCase()}
    </div>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ pct=0, color='var(--ac)' }) {
  return (
    <div style={{ height:5, background:'var(--brd)', borderRadius:3, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:color, borderRadius:3, transition:'width .4s ease' }}/>
    </div>
  )
}
