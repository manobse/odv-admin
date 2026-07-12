import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAsync } from '../hooks/useAsync'
import { reportsApi } from '../api/client'
import { Spinner, StatCard, Card, Tabs, Badge } from '../components/ui'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const PIE_COLORS = ['#7c6fff','#22d26e','#ffb547','#ff5757','#47a3ff','#2dd4bf','#ec4899','#f97316']
const ttStyle = { background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, fontSize:13 }
const axStyle = { fill:'var(--text3)', fontSize:11 }

export default function Reports() {
  const [tab, setTab] = useState('financial')

  const { data: fin, loading: fl } = useAsync(() => reportsApi.financial())
  const { data: mon, loading: ml } = useAsync(() => reportsApi.monthly())
  const { data: spr, loading: sl } = useAsync(() => reportsApi.sports())
  const { data: crt, loading: cl } = useAsync(() => reportsApi.courts())

  const fd = fin?.data ?? {}
  const totalIncome  = fd.totalIncome  ?? 0
  const totalExpense = fd.totalExpense ?? 0
  const profit       = fd.netProfit    ?? 0

  const yr     = new Date().getFullYear()
  const incMap = Object.fromEntries((mon?.data?.income  ?? []).map(x => [x._id, x.total]))
  const expMap = Object.fromEntries((mon?.data?.expense ?? []).map(x => [x._id, x.total]))
  const monthlyData = MONTHS.map((m, i) => {
    const key = `${yr}-${String(i+1).padStart(2,'0')}`
    return { month: m, Income: incMap[key] ?? 0, Expenses: expMap[key] ?? 0 }
  })

  const incPie = (fd.incomeByCategory  ?? []).map((c, i) => ({ name: c.category, value: c.total, fill: PIE_COLORS[i % PIE_COLORS.length] }))
  const expPie = (fd.expenseByCategory ?? []).map((c, i) => ({ name: c.category, value: c.total, fill: PIE_COLORS[(i+3) % PIE_COLORS.length] }))

  return (
    <div>
      <div style={{ fontFamily:'var(--ffH)', fontSize:20, fontWeight:700, marginBottom:2 }}>Reports</div>
      <div style={{ fontSize:13, color:'var(--text3)', marginBottom:18 }}>Financial & operational analytics</div>

      <Tabs
        tabs={[
          { key:'financial', label:'📊 Financial' },
          { key:'monthly',   label:'📅 Monthly Trend' },
          { key:'sports',    label:'🏅 By Sport' },
          { key:'courts',    label:'🏟 Courts' },
          { key:'pl',        label:'💰 P&L' },
        ]}
        active={tab} onChange={setTab}
      />

      {/* ── Financial ── */}
      {tab === 'financial' && (fl ? <Spinner center /> : <>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14, marginBottom:20 }}>
          <StatCard label="Total Revenue"  value={fmt(totalIncome)}  color="var(--green)" />
          <StatCard label="Total Expenses" value={fmt(totalExpense)} color="var(--red)" />
          <StatCard label="Net Profit"     value={fmt(profit)}       color={profit >= 0 ? 'var(--accent)' : 'var(--red)'} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card>
            <div style={{ fontFamily:'var(--ffH)', fontWeight:700, marginBottom:16 }}>Income by Category</div>
            {incPie.length === 0 ? <p style={{ color:'var(--text3)', fontSize:14 }}>No income data</p> : <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={incPie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent*100).toFixed(0)}%` : ''} labelLine={false}>
                    {incPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={v => [fmt(v)]} contentStyle={ttStyle} />
                </PieChart>
              </ResponsiveContainer>
              {fd.incomeByCategory?.map((c, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink:0 }} />
                    {c.category}
                  </div>
                  <strong style={{ color:'var(--green)' }}>{fmt(c.total)}</strong>
                </div>
              ))}
            </>}
          </Card>
          <Card>
            <div style={{ fontFamily:'var(--ffH)', fontWeight:700, marginBottom:16 }}>Expense by Category</div>
            {expPie.length === 0 ? <p style={{ color:'var(--text3)', fontSize:14 }}>No expense data</p> : <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={expPie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent*100).toFixed(0)}%` : ''} labelLine={false}>
                    {expPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={v => [fmt(v)]} contentStyle={ttStyle} />
                </PieChart>
              </ResponsiveContainer>
              {fd.expenseByCategory?.map((c, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background: PIE_COLORS[(i+3) % PIE_COLORS.length], flexShrink:0 }} />
                    {c.category}
                  </div>
                  <strong style={{ color:'var(--red)' }}>{fmt(c.total)}</strong>
                </div>
              ))}
            </>}
          </Card>
        </div>
      </>)}

      {/* ── Monthly ── */}
      {tab === 'monthly' && (ml ? <Spinner center /> : (
        <Card>
          <div style={{ fontFamily:'var(--ffH)', fontWeight:700, marginBottom:16 }}>Monthly Revenue vs Expenses — {yr}</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData} barGap={4} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={axStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axStyle} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
              <Tooltip contentStyle={ttStyle} labelStyle={{ color:'var(--text)', fontWeight:600 }} formatter={v => [fmt(v)]} />
              <Bar dataKey="Income"   fill="var(--green)" opacity={.85} radius={[4,4,0,0]} />
              <Bar dataKey="Expenses" fill="var(--red)"   opacity={.75} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      ))}

      {/* ── By Sport ── */}
      {tab === 'sports' && (sl ? <Spinner center /> : (
        <Card>
          <div style={{ fontFamily:'var(--ffH)', fontWeight:700, marginBottom:16 }}>Sport-wise Revenue</div>
          {spr?.data?.length === 0 ? <p style={{ color:'var(--text3)', fontSize:14 }}>No booking data yet</p> : <>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={spr?.data?.map(s => ({ name:`${s.icon} ${s.sportName}`, Revenue: s.totalRevenue }))} layout="vertical" margin={{ left:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={axStyle} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
                <YAxis type="category" dataKey="name" tick={{ ...axStyle, fontSize:12 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={ttStyle} formatter={v => [fmt(v), 'Revenue']} />
                <Bar dataKey="Revenue" fill="var(--accent)" opacity={.85} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop:16 }}>
              {spr?.data?.map((s, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span>{s.icon} <strong>{s.sportName}</strong></span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:700, color: s.color || 'var(--accent)' }}>{fmt(s.totalRevenue)}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{s.bookingCount} bookings</div>
                  </div>
                </div>
              ))}
            </div>
          </>}
        </Card>
      ))}

      {/* ── Courts ── */}
      {tab === 'courts' && (cl ? <Spinner center /> : (
        <Card>
          <div style={{ fontFamily:'var(--ffH)', fontWeight:700, marginBottom:16 }}>Court Utilization</div>
          {crt?.data?.length === 0 ? <p style={{ color:'var(--text3)', fontSize:14 }}>No utilization data yet</p> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                <thead><tr>{['Court','Sport','Bookings','Revenue'].map(h => <th key={h} style={{ textAlign:'left', padding:'9px 14px', background:'var(--surface2)', color:'var(--text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>)}</tr></thead>
                <tbody>{crt?.data?.map((c, i) => (
                  <tr key={i}>
                    <td style={{ padding:'11px 14px', borderTop:'1px solid var(--border)', fontWeight:500 }}>{c.courtName}</td>
                    <td style={{ padding:'11px 14px', borderTop:'1px solid var(--border)', fontSize:13, color:'var(--text2)' }}>{c.sportName}</td>
                    <td style={{ padding:'11px 14px', borderTop:'1px solid var(--border)' }}><Badge variant="blue">{c.bookings}</Badge></td>
                    <td style={{ padding:'11px 14px', borderTop:'1px solid var(--border)', fontWeight:600, color:'var(--green)' }}>{fmt(c.revenue)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Card>
      ))}

      {/* ── P&L ── */}
      {tab === 'pl' && (fl ? <Spinner center /> : (
        <Card>
          <div style={{ fontFamily:'var(--ffH)', fontWeight:700, fontSize:16, marginBottom:20 }}>Profit & Loss Statement</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <tbody>
              <tr style={{ background:'var(--greenD)' }}><td colSpan={2} style={{ padding:'10px 14px', fontWeight:700, color:'var(--green)' }}>INCOME</td></tr>
              {fd.incomeByCategory?.map(c => <tr key={c.category}><td style={{ padding:'8px 28px', color:'var(--text2)' }}>{c.category}</td><td style={{ textAlign:'right', padding:'8px 14px', fontWeight:500 }}>{fmt(c.total)}</td></tr>)}
              <tr style={{ borderTop:'2px solid var(--border)', fontWeight:700 }}>
                <td style={{ padding:'10px 14px' }}>Total Income</td>
                <td style={{ textAlign:'right', padding:'10px 14px', color:'var(--green)', fontSize:15 }}>{fmt(totalIncome)}</td>
              </tr>
              <tr style={{ background:'var(--redD)' }}><td colSpan={2} style={{ padding:'10px 14px', fontWeight:700, color:'var(--red)' }}>EXPENSES</td></tr>
              {fd.expenseByCategory?.map(c => <tr key={c.category}><td style={{ padding:'8px 28px', color:'var(--text2)' }}>{c.category}</td><td style={{ textAlign:'right', padding:'8px 14px', fontWeight:500 }}>{fmt(c.total)}</td></tr>)}
              <tr style={{ borderTop:'2px solid var(--border)', fontWeight:700 }}>
                <td style={{ padding:'10px 14px' }}>Total Expenses</td>
                <td style={{ textAlign:'right', padding:'10px 14px', color:'var(--red)', fontSize:15 }}>{fmt(totalExpense)}</td>
              </tr>
              <tr style={{ background: profit >= 0 ? 'var(--accentD)' : 'var(--redD)', borderTop:'2px solid var(--border3)' }}>
                <td style={{ padding:'16px 14px', fontFamily:'var(--ffH)', fontWeight:700, fontSize:16 }}>NET PROFIT / LOSS</td>
                <td style={{ textAlign:'right', padding:'16px 14px', fontFamily:'var(--ffH)', fontWeight:800, fontSize:22, color: profit >= 0 ? 'var(--accent)' : 'var(--red)' }}>{fmt(profit)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  )
}
