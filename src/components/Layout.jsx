import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const NAV = [
  { to:'/',           label:'Dashboard',     icon:'⊞', sec:null },
  { to:'/sports',     label:'Sports',        icon:'🏅', sec:'Management' },
  { to:'/courts',     label:'Courts',        icon:'🏟', sec:null },
  { to:'/charges',    label:'Charges',       icon:'⚡', sec:null },
  { to:'/taxes',      label:'Taxes',         icon:'📋', sec:null },
  { to:'/players',    label:'Players',       icon:'👤', sec:'Operations' },
  { to:'/bookings',   label:'Bookings',      icon:'📅', sec:null },
  { to:'/income',     label:'Income',        icon:'📈', sec:'Finance' },
  { to:'/expenses',   label:'Expenses',      icon:'📉', sec:null },
  { to:'/categories', label:'Categories',    icon:'🗂', sec:null },
  { to:'/staff',      label:'Staff',         icon:'👥', sec:'HR' },
  { to:'/payroll',    label:'Payroll',       icon:'💵', sec:null },
  { to:'/reports',    label:'Reports',       icon:'📊', sec:'System' },
  { to:'/audit',      label:'Audit Logs',    icon:'📜', sec:null },
  { to:'/roles',      label:'Roles & Perms', icon:'🔑', sec:null },
]

export function Layout({ children }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const [dark,     setDark]     = useState(() => localStorage.getItem('sp_theme') !== 'light')
  const [sideOpen, setSideOpen] = useState(false)

  useEffect(() => {
    document.body.className = dark ? '' : 'light'
    localStorage.setItem('sp_theme', dark ? 'dark' : 'light')
  }, [dark])

  // Close sidebar on route change (mobile)
  useEffect(() => { setSideOpen(false) }, [location.pathname])

  async function handleLogout() {
    await logout()
    toast('Signed out', 'info')
  }

  const pageLabel = NAV.find(n => n.to === location.pathname)?.label ?? 'Dashboard'

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>

      {/* ── Backdrop (mobile) ── */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:199, animation:'fadeUp .15s ease' }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        position:'fixed', top:0, left:0, bottom:0, width:'var(--sw)',
        background:'var(--bg2)', borderRight:'1px solid var(--brd)',
        display:'flex', flexDirection:'column', zIndex:200,
        transform: sideOpen ? 'translateX(0)' : undefined,
        transition:'transform .25s cubic-bezier(.4,0,.2,1)',
      }}
        className={`sp-sidebar${sideOpen ? ' open' : ''}`}
      >
        <style>{`
          @media(max-width:900px){
            .sp-sidebar{ transform:translateX(-100%) !important; }
            .sp-sidebar.open{ transform:translateX(0) !important; }
            .sp-main{ margin-left:0 !important; }
            .sp-ham{ display:flex !important; }
          }
        `}</style>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'18px 16px 14px', borderBottom:'1px solid var(--brd)', flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,var(--ac),var(--tl))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--ffH)', fontWeight:800, fontSize:15, color:'#fff', flexShrink:0 }}>
            SP
          </div>
          <div>
            <div style={{ fontFamily:'var(--ffH)', fontWeight:700, fontSize:14.5 }}>SportsPlex</div>
            <div style={{ fontSize:11, color:'var(--tx3)', marginTop:1 }}>Admin Portal</div>
          </div>
          <button
            onClick={() => setSideOpen(false)}
            style={{ marginLeft:'auto', background:'none', color:'var(--tx3)', padding:5, borderRadius:6, fontSize:18, display:'none' }}
            className="sp-close"
          >✕</button>
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, overflowY:'auto', padding:'6px 0 8px' }}>
          {(() => {
            let lastSec = null
            return NAV.map(n => {
              const showSec = n.sec && n.sec !== lastSec
              if (showSec) lastSec = n.sec
              return (
                <div key={n.to}>
                  {showSec && (
                    <div style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--tx3)', padding:'14px 22px 5px' }}>
                      {n.sec}
                    </div>
                  )}
                  <NavLink
                    to={n.to}
                    end={n.to === '/'}
                    style={({ isActive }) => ({
                      display:'flex', alignItems:'center', gap:9,
                      padding:'9px 16px', margin:'1px 8px', borderRadius:'var(--r)',
                      fontSize:13.5, fontWeight:500, textDecoration:'none',
                      color: isActive ? 'var(--ac)' : 'var(--tx2)',
                      background: isActive ? 'var(--acD)' : 'transparent',
                      transition:'all .14s',
                    })}
                  >
                    <span style={{ fontSize:16 }}>{n.icon}</span>
                    {n.label}
                  </NavLink>
                </div>
              )
            })
          })()}
        </nav>

        {/* User + logout */}
        <div style={{ padding:'10px 10px 12px', borderTop:'1px solid var(--brd)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', marginBottom:6 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--acD)', color:'var(--ac)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'var(--tx3)' }}>{user?.role?.name}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:8, justifyContent:'center', padding:'8px', borderRadius:'var(--r)', fontSize:13, fontWeight:500, color:'var(--tx2)', background:'transparent', border:'1px solid var(--brd2)', cursor:'pointer', transition:'all .15s' }}
            onMouseEnter={e => Object.assign(e.currentTarget.style, { background:'var(--rdD)', color:'var(--rd)', borderColor:'rgba(255,87,87,.3)' })}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { background:'transparent', color:'var(--tx2)', borderColor:'var(--brd2)' })}
          >
            ⏻ Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div
        className="sp-main"
        style={{ flex:1, minWidth:0, marginLeft:'var(--sw)', display:'flex', flexDirection:'column', minHeight:'100vh' }}
      >
        {/* Topbar */}
        <header style={{ height:'var(--th)', display:'flex', alignItems:'center', gap:12, padding:'0 24px', background:'var(--bg2)', borderBottom:'1px solid var(--brd)', position:'sticky', top:0, zIndex:100 }}>
          <button
            className="sp-ham"
            onClick={() => setSideOpen(true)}
            style={{ display:'none', background:'none', color:'var(--tx2)', padding:6, borderRadius:'var(--r)', fontSize:20, lineHeight:1 }}
          >
            ☰
          </button>
          <h1 style={{ fontFamily:'var(--ffH)', fontSize:16, fontWeight:600, flex:1 }}>{pageLabel}</h1>
          <button
            onClick={() => setDark(d => !d)}
            title="Toggle theme"
            style={{ background:'none', color:'var(--tx2)', padding:8, borderRadius:'var(--r)', fontSize:17, lineHeight:1, transition:'all .15s' }}
          >
            {dark ? '☀' : '🌙'}
          </button>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--acD)', color:'var(--ac)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13 }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, padding:24, animation:'fadeUp .2s ease' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
