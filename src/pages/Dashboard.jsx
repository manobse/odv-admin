import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAsync } from '../hooks/useAsync'
import { reportsApi, bookingsApi } from '../api/client'
import { StatCard, Card, Spinner, Badge } from '../components/ui'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Dashboard() {
  const { data: kpi,   loading: kl } = useAsync(() => reportsApi.dashboard())
  const { data: mon,   loading: ml } = useAsync(() => reportsApi.monthly())
  const { data: sport, loading: sl } = useAsync(() => reportsApi.sports())
  const { data: bk,    loading: bl } = useAsync(() => bookingsApi.list({ limit: 6 }))

  const kd = kpi?.data ?? {}
  const yr = new Date().getFullYear()
  const incMap = Object.fromEntries((mon?.data?.income  ?? []).map(x => [x._id, x.total]))
  const expMap = Object.fromEntries((mon?.data?.expense ?? []).map(x => [x._id, x.total]))
  const chartData = MONTHS.map((m, i) => {
    const key = `${yr}-${String(i + 1).padStart(2, '0')}`
    return { month: m, Income: incMap[key] ?? 0, Expenses: expMap[key] ?? 0 }
  })

  const ttStyle = { background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, fontSize:13 }
  const axStyle = { fill:'var(--text3)', fontSize:11 }

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14, marginBottom:20 }}>
        {kl ? <Spinner center /> : <>
          <StatCard label="Total Income"    value={fmt(kd.totalIncome)}   color="var(--green)"  change="vs last month" dir="up"/>
          <StatCard label="Total Expenses"  value={fmt(kd.totalExpense)}  color="var(--red)"    change="vs last month" dir="dn"/>
          <StatCard label="Net Profit"      value={fmt(kd.netProfit)}     color={kd.netProfit >= 0 ? 'var(--accent)' : 'var(--red)'} />
          <StatCard label="Active Bookings" value={kd.totalBookings ?? 0} color="var(--teal)" />
          <StatCard label="Pending Payroll" value={kd.pendingPayroll ?? 0} color="var(--amber)" />
        </>}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16, marginBottom:18 }}>
        {/* Bar chart */}
        <Card>
          <div style={{ fontFamily:'var(--ffH)', fontWeight:700, fontSize:15, marginBottom:16 }}>Monthly Revenue vs Expenses</div>
          {ml ? <Spinner center /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={3} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={axStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
                <Tooltip contentStyle={ttStyle} labelStyle={{ color:'var(--text)', fontWeight:600 }} formatter={v => [fmt(v)]} />
                <Legend wrapperStyle={{ fontSize:12, paddingTop:10 }} />
                <Bar dataKey="Income"   fill="var(--green)" opacity={0.85} radius={[4,4,0,0]} />
                <Bar dataKey="Expenses" fill="var(--red)"   opacity={0.75} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Sport Revenue */}
        <Card>
          <div style={{ fontFamily:'var(--ffH)', fontWeight:700, fontSize:15, marginBottom:16 }}>Sport Revenue</div>
          {sl ? <Spinner center /> : sport?.data?.length === 0
            ? <p style={{ color:'var(--text3)', fontSize:14 }}>No booking data yet</p>
            : sport?.data?.slice(0, 5).map((s, i) => (
              <div key={i} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
                  <span>{s.icon} <strong>{s.sportName}</strong></span>
                  <span style={{ fontWeight:700, color: s.color || 'var(--accent)' }}>{fmt(s.totalRevenue)}</span>
                </div>
                <div style={{ height:5, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background: s.color || 'var(--accent)', borderRadius:3,
                    width:`${(s.totalRevenue / (sport.data[0]?.totalRevenue || 1)) * 100}%`,
                    transition:'width .5s ease' }} />
                </div>
              </div>
            ))
          }
        </Card>
      </div>

      {/* ── Recent Bookings ── */}
      <Card>
        <div style={{ fontFamily:'var(--ffH)', fontWeight:700, fontSize:15, marginBottom:14 }}>Recent Bookings</div>
        {bl ? <Spinner center /> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>{['Booking ID','Player','Sport / Court','Date','Amount','Status'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'9px 14px', background:'var(--surface2)', color:'var(--text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {(!bk?.data || bk.data.length === 0)
                  ? <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text3)', padding:30, fontSize:14 }}>No bookings yet</td></tr>
                  : bk.data.map(b => (
                    <tr key={b._id}>
                      <td style={{ padding:'12px 14px', borderTop:'1px solid var(--border)' }}><code style={{ fontSize:12, color:'var(--accent)' }}>{b.bookingId}</code></td>
                      <td style={{ padding:'12px 14px', borderTop:'1px solid var(--border)', fontWeight:500 }}>{b.player?.name || '—'}</td>
                      <td style={{ padding:'12px 14px', borderTop:'1px solid var(--border)' }}>
                        <div style={{ fontSize:13 }}>{b.sport?.icon} {b.sport?.name}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{b.court?.name}</div>
                      </td>
                      <td style={{ padding:'12px 14px', borderTop:'1px solid var(--border)', color:'var(--text2)', fontSize:12 }}>{b.date}</td>
                      <td style={{ padding:'12px 14px', borderTop:'1px solid var(--border)', fontWeight:600 }}>{fmt(b.totalAmount)}</td>
                      <td style={{ padding:'12px 14px', borderTop:'1px solid var(--border)' }}>
                        <Badge variant={b.status === 'Confirmed' ? 'green' : b.status === 'Pending' ? 'amber' : 'red'}>{b.status}</Badge>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
