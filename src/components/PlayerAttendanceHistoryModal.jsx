import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { formatDate } from '../helpers'
import { attendanceApi, sportsApi } from '../api/client'
import { Modal, Tbl, Pagination, StatCard, Spinner, Btn, ErrMsg } from './ui'
import { AttendanceStatusBadge, AttendanceSessionBadge } from './AttendanceStatus'
import { ATTENDANCE_SESSIONS, ATTENDANCE_STATUSES } from '../constants/attendance'

const emptyFilters = { startDate:'', endDate:'', sportId:'', session:'', status:'' }

// ── PlayerAttendanceHistoryModal ─────────────────────────────────────────────
// Attendance section for a single player's detail view, per GET /api/players/:id/attendance
// (records) + GET /api/attendance/summary?playerId=... (aggregate totals/percent).
export function PlayerAttendanceHistoryModal({ player, onClose }) {
  const [page,    setPage]    = useState(1)
  const [limit,   setLimit]   = useState(50)
  const [filters, setFilters] = useState(emptyFilters)

  const { data: sD } = useAsync(() => sportsApi.list({ limit: 50 }))
  const sports = sD?.data || []

  const { data, loading, error } = useAsync(
    () => attendanceApi.forPlayer(player._id, {
      page, limit,
      ...(filters.startDate ? { startDate: filters.startDate } : {}),
      ...(filters.endDate   ? { endDate: filters.endDate }     : {}),
      ...(filters.sportId   ? { sportId: filters.sportId }     : {}),
      ...(filters.session   ? { session: filters.session }     : {}),
      ...(filters.status    ? { status: filters.status }       : {}),
    }),
    [player._id, page, limit, filters.startDate, filters.endDate, filters.sportId, filters.session, filters.status]
  )
  const rows = data?.data || []
  const pg   = data?.pagination

  const { data: sumRes, loading: sumLoading } = useAsync(
    () => attendanceApi.summary({
      playerId: player._id,
      ...(filters.startDate ? { startDate: filters.startDate } : {}),
      ...(filters.endDate   ? { endDate: filters.endDate }     : {}),
      ...(filters.sportId   ? { sportId: filters.sportId }     : {}),
      ...(filters.session   ? { session: filters.session }     : {}),
    }),
    [player._id, filters.startDate, filters.endDate, filters.sportId, filters.session]
  )
  const stats = sumRes?.data?.playerWise?.[0]

  function changeFilter(f) { setFilters(prev => ({ ...prev, ...f })); setPage(1) }
  function changeLimit(l)  { setLimit(l); setPage(1) }
  function clearFilters()  { setFilters(emptyFilters); setPage(1) }
  const hasActiveFilters = Object.values(filters).some(Boolean)

  const cols = [
    { key:'date',    label:'Date',    render: r => <span style={{ fontSize:13 }}>{formatDate(r.attendanceDate)}</span> },
    { key:'sport',   label:'Sport',   render: r => r.sport ? <span style={{ fontSize:13 }}>{r.sport.icon} {r.sport.name}</span> : <span style={{ color:'var(--tx3)' }}>—</span> },
    { key:'session', label:'Session', render: r => <AttendanceSessionBadge session={r.session} /> },
    { key:'status',  label:'Status',  render: r => <AttendanceStatusBadge status={r.status} /> },
  ]

  return (
    <Modal title={`Attendance — ${player.name}`} onClose={onClose} wide footer={<Btn variant="ghost" size="sm" onClick={onClose}>Close</Btn>}>
      {sumLoading ? <Spinner center /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12, marginBottom:20 }}>
          <StatCard label="Total Sessions" value={stats?.total ?? 0} />
          <StatCard label="Present"        value={stats?.present ?? 0} color="var(--gr)" />
          <StatCard label="Absent"         value={stats?.absent ?? 0}  color="var(--rd)" />
          <StatCard label="Attendance %"   value={`${Number(stats?.attendancePercent ?? 0).toFixed(1)}%`} color="var(--ac)" />
        </div>
      )}

      {error && <ErrMsg msg={error} />}

      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16, alignItems:'flex-end' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, color:'var(--tx3)' }}>From Date</label>
          <input type="date" value={filters.startDate} onChange={e => changeFilter({ startDate: e.target.value })} style={{ width:'auto' }} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, color:'var(--tx3)' }}>To Date</label>
          <input type="date" value={filters.endDate} onChange={e => changeFilter({ endDate: e.target.value })} style={{ width:'auto' }} />
        </div>
        <select value={filters.sportId} onChange={e => changeFilter({ sportId: e.target.value })} style={{ width:'auto' }}>
          <option value="">All Sports</option>
          {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </select>
        <select value={filters.session} onChange={e => changeFilter({ session: e.target.value })} style={{ width:'auto' }}>
          <option value="">All Sessions</option>
          {ATTENDANCE_SESSIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filters.status} onChange={e => changeFilter({ status: e.target.value })} style={{ width:'auto' }}>
          <option value="">All Status</option>
          {ATTENDANCE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {hasActiveFilters && <Btn variant="ghost" size="sm" onClick={clearFilters}>Clear Filters</Btn>}
      </div>

      <Tbl
        cols={cols} rows={rows} loading={loading}
        empty={hasActiveFilters ? 'No attendance matches your filters.' : 'No attendance recorded for this player yet.'}
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
    </Modal>
  )
}
