import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../helpers'
import { attendanceApi, sportsApi, playersApi } from '../api/client'
import { Btn, Tbl, Modal, FG, FRow, Spinner, PageHeader, Pagination, ErrMsg, SearchableSelect, StatCard, Card } from '../components/ui'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { AttendanceStatusBadge, AttendanceSessionBadge } from '../components/AttendanceStatus'
import { PlayerMultiSelect } from '../components/PlayerMultiSelect'
import { ATTENDANCE_SESSIONS, ATTENDANCE_STATUSES, ATTENDANCE_SESSION_LABEL } from '../constants/attendance'

const today = () => new Date().toISOString().slice(0, 10)
const emptyFilters = { date:'', startDate:'', endDate:'', sportId:'', session:'', playerId:'', status:'' }
const emptyMarkForm = sportId => ({ date: today(), sportId: sportId || '', session:'MORNING', status:'PRESENT', notes:'', playerIds:[] })

export default function Attendance() {
  const toast = useToast()
  const { hasPerm } = useAuth()
  const canManage = hasPerm('attendance')

  // ── Reference data ──────────────────────────────────────────────────────────
  const { data: sD } = useAsync(() => sportsApi.list({ limit: 50 }))
  const { data: pD } = useAsync(() => playersApi.list({ limit: 200 }))
  const sports       = sD?.data || []
  const activeSports = sports.filter(s => s.active)
  const players      = (pD?.data || []).slice().sort((a, b) => a.name.localeCompare(b.name))

  // ── Quick summary (independent of the records table filters) ───────────────
  const [summaryDate, setSummaryDate] = useState(today())
  const { data: sumRes, loading: summaryLoading, reload: reloadSummary } = useAsync(
    () => attendanceApi.summary({ startDate: summaryDate, endDate: summaryDate }),
    [summaryDate]
  )
  const sumD        = sumRes?.data
  const sessionWise = sumD?.sessionWise || {}
  const sportWise   = sumD?.sportWise || []

  // ── Records table ────────────────────────────────────────────────────────────
  const [page,    setPage]    = useState(1)
  const [limit,   setLimit]   = useState(50)
  const [filters, setFilters] = useState(emptyFilters)
  const [search,  setSearch]  = useState('')

  const { data, loading, error, reload } = useAsync(
    () => attendanceApi.list({
      page, limit,
      ...(filters.date
        ? { attendanceDate: filters.date }
        : {
            ...(filters.startDate ? { startDate: filters.startDate } : {}),
            ...(filters.endDate   ? { endDate: filters.endDate }     : {}),
          }),
      ...(filters.sportId  ? { sportId: filters.sportId }   : {}),
      ...(filters.session  ? { session: filters.session }   : {}),
      ...(filters.playerId ? { playerId: filters.playerId } : {}),
      ...(filters.status   ? { status: filters.status }     : {}),
      ...(search ? { search } : {}),
    }),
    [page, limit, filters.date, filters.startDate, filters.endDate, filters.sportId, filters.session, filters.playerId, filters.status, search]
  )
  const rows = data?.data || []
  const pg   = data?.pagination

  function changeFilter(f) { setFilters(prev => ({ ...prev, ...f })); setPage(1) }
  function changeSearch(v) { setSearch(v); setPage(1) }
  function changeLimit(l)  { setLimit(l); setPage(1) }
  function clearFilters()  { setFilters(emptyFilters); setSearch(''); setPage(1) }
  const hasActiveFilters = !!(search || Object.values(filters).some(Boolean))

  // ── Mark Attendance ──────────────────────────────────────────────────────────
  const [markModal,  setMarkModal]  = useState(false)
  const [markForm,   setMarkForm]   = useState(emptyMarkForm())
  const [markSaving, setMarkSaving] = useState(false)
  const pMark = f => setMarkForm(prev => ({ ...prev, ...f }))

  function openMark() {
    setMarkForm(emptyMarkForm(activeSports[0]?._id))
    setMarkModal(true)
  }

  async function submitMark() {
    if (!markForm.date)                    { toast('Select a date', 'error'); return }
    if (!markForm.sportId)                 { toast('Select a sport', 'error'); return }
    if (!markForm.session)                 { toast('Select a session', 'error'); return }
    if (markForm.playerIds.length === 0)   { toast('Select at least one player', 'error'); return }
    setMarkSaving(true)
    try {
      const r = await attendanceApi.bulk({
        attendanceDate: markForm.date,
        session:        markForm.session,
        sportId:        markForm.sportId,
        playerIds:      markForm.playerIds,
        status:         markForm.status,
        notes:          markForm.notes,
      })
      const { created, skipped } = r.data
      if (created > 0 && skipped > 0) {
        toast(`${created} player${created !== 1 ? 's' : ''} marked. ${skipped} already had attendance for this session.`, 'warning')
      } else if (created > 0) {
        toast(`Attendance marked for ${created} player${created !== 1 ? 's' : ''}.`, 'success')
      } else {
        toast('All selected players already had attendance for this session.', 'info')
      }
      setMarkModal(false)
      if (summaryDate === markForm.date) reloadSummary()
      else setSummaryDate(markForm.date)
      reload()
    } catch (e) { toast(e.message, 'error') }
    finally { setMarkSaving(false) }
  }

  // ── Detail / Edit / Delete ───────────────────────────────────────────────────
  const [detail,      setDetail]      = useState(null)
  const [editForm,    setEditForm]    = useState(null)
  const [editSaving,  setEditSaving]  = useState(false)
  const [delTarget,   setDelTarget]   = useState(null)
  const [deleting,    setDeleting]    = useState(false)

  function openEdit(row) {
    setEditForm({
      _id:     row._id,
      player:  row.player,
      sport:   row.sport?._id || row.sport,
      date:    row.attendanceDate,
      session: row.session,
      status:  row.status,
      notes:   row.notes || '',
    })
    setDetail(null)
  }

  async function saveEdit() {
    setEditSaving(true)
    try {
      await attendanceApi.update(editForm._id, {
        sport:          editForm.sport,
        attendanceDate: editForm.date,
        session:        editForm.session,
        status:         editForm.status,
        notes:          editForm.notes,
      })
      toast('Attendance updated', 'success')
      setEditForm(null)
      reload()
      reloadSummary()
    } catch (e) { toast(e.message, 'error') }
    finally { setEditSaving(false) }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await attendanceApi.del(delTarget._id)
      toast('Attendance record deleted', 'success')
      setDelTarget(null)
      reload()
      reloadSummary()
    } catch (e) { toast(e.message, 'error') }
    finally { setDeleting(false) }
  }

  const cols = [
    { key:'date',    label:'Date',    render: r => <span style={{ fontSize:13 }}>{formatDate(r.attendanceDate)}</span> },
    { key:'player',  label:'Player',  render: r => <strong>{r.player?.name || '—'}</strong> },
    { key:'sport',   label:'Sport',   render: r => r.sport ? <span style={{ fontSize:13 }}>{r.sport.icon} {r.sport.name}</span> : <span style={{ color:'var(--tx3)' }}>—</span> },
    { key:'session', label:'Session', render: r => <AttendanceSessionBadge session={r.session} /> },
    { key:'status',  label:'Status',  render: r => <AttendanceStatusBadge status={r.status} /> },
    { key:'markedBy',label:'Marked By', render: r => <span style={{ fontSize:13, color:'var(--tx2)' }}>{r.markedBy?.name || '—'}</span> },
    {
      key:'actions', label:'', render: r => (
        <div style={{ display:'flex', gap:6 }}>
          <Btn variant="ghost" size="xs" onClick={() => setDetail(r)}>View</Btn>
          {canManage && <Btn variant="ghost" size="xs" onClick={() => openEdit(r)}>Edit</Btn>}
          {canManage && <Btn variant="danger" size="xs" onClick={() => setDelTarget(r)}>🗑</Btn>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Attendance" sub="Daily player attendance for sports sessions"
        action={canManage && <Btn size="sm" onClick={openMark}>＋ Mark Attendance</Btn>}
      />

      {/* ── Quick Summary ── */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom:16 }}>
          <div style={{ fontFamily:'var(--ffH)', fontWeight:700, fontSize:15 }}>Attendance Summary</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <label style={{ fontSize:12, color:'var(--tx3)' }}>For date</label>
            <input type="date" value={summaryDate} onChange={e => setSummaryDate(e.target.value)} style={{ width:'auto' }} />
          </div>
        </div>
        {summaryLoading ? <Spinner center /> : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:14, marginBottom:20 }}>
              <StatCard label="Total Marked"    value={sumD?.totalAttendance ?? 0} />
              <StatCard label="Present"         value={sumD?.presentCount ?? 0}    color="var(--gr)" />
              <StatCard label="Absent"          value={sumD?.absentCount ?? 0}     color="var(--rd)" />
              <StatCard label="Unique Players"  value={sumD?.uniquePlayers ?? 0}   color="var(--ac)" />
              <StatCard label="Morning"         value={sessionWise.MORNING ?? 0}   color="var(--am)" />
              <StatCard label="Evening"         value={sessionWise.EVENING ?? 0}   color="var(--bl)" />
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>
              Sport-wise Breakdown
            </div>
            {sportWise.length === 0 ? (
              <p style={{ color:'var(--tx3)', fontSize:13 }}>No attendance recorded for this date.</p>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                {sportWise.map(sw => {
                  const sp = sports.find(s => s._id === sw.sportId)
                  return (
                    <div key={sw.sportId} style={{ background:'var(--surf2)', border:'1px solid var(--brd)', borderRadius:'var(--r)', padding:'12px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>{sp?.icon} {sw.sportName}</div>
                      <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--tx2)', flexWrap:'wrap' }}>
                        <span>Total: <strong>{sw.total}</strong></span>
                        <span style={{ color:'var(--gr)' }}>Present: {sw.present}</span>
                        <span style={{ color:'var(--rd)' }}>Absent: {sw.absent}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </Card>

      {error && <ErrMsg msg={error} />}

      {/* ── Filters ── */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:18, alignItems:'flex-end' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, color:'var(--tx3)' }}>Date</label>
          <input type="date" value={filters.date} onChange={e => changeFilter({ date: e.target.value, startDate:'', endDate:'' })} style={{ width:'auto' }} />
        </div>
        {!filters.date && (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>From Date</label>
              <input type="date" value={filters.startDate} onChange={e => changeFilter({ startDate: e.target.value })} style={{ width:'auto' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>To Date</label>
              <input type="date" value={filters.endDate} onChange={e => changeFilter({ endDate: e.target.value })} style={{ width:'auto' }} />
            </div>
          </>
        )}
        <select value={filters.sportId} onChange={e => changeFilter({ sportId: e.target.value })} style={{ width:'auto' }}>
          <option value="">All Sports</option>
          {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </select>
        <select value={filters.session} onChange={e => changeFilter({ session: e.target.value })} style={{ width:'auto' }}>
          <option value="">All Sessions</option>
          {ATTENDANCE_SESSIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <SearchableSelect
          options={players}
          value={filters.playerId}
          onChange={id => changeFilter({ playerId: id })}
          getKey={pl => pl._id}
          getLabel={pl => `${pl.name}${pl.nickname ? ` (${pl.nickname})` : ''}`.trim()}
          placeholder="All Players"
          style={{ width:220 }}
        />
        <select value={filters.status} onChange={e => changeFilter({ status: e.target.value })} style={{ width:'auto' }}>
          <option value="">All Status</option>
          {ATTENDANCE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input value={search} onChange={e => changeSearch(e.target.value)} placeholder="🔍 Search notes…" style={{ maxWidth:200 }} />
        {hasActiveFilters && <Btn variant="ghost" size="sm" onClick={clearFilters}>Clear Filters</Btn>}
      </div>

      {/* ── Records Table ── */}
      <Tbl
        cols={cols} rows={rows} loading={loading}
        empty={hasActiveFilters ? 'No attendance records match your filters.' : 'No attendance recorded yet.'}
      />
      {!loading && rows.length === 0 && !hasActiveFilters && canManage && (
        <div style={{ textAlign:'center', marginTop:14 }}>
          <Btn size="sm" onClick={openMark}>＋ Mark Attendance</Btn>
        </div>
      )}
      {pg && (
        <Pagination
          page={pg.page} limit={pg.limit}
          totalRecords={pg.totalRecords} totalPages={pg.totalPages}
          hasNextPage={pg.hasNextPage} hasPreviousPage={pg.hasPreviousPage}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      )}

      {/* ── Mark Attendance Modal ── */}
      {markModal && (
        <Modal
          title="Mark Attendance"
          onClose={() => !markSaving && setMarkModal(false)}
          wide
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setMarkModal(false)} disabled={markSaving}>Cancel</Btn>
              <Btn size="sm" loading={markSaving} onClick={submitMark}>
                {markSaving ? 'Marking Attendance…' : 'Mark Attendance'}
              </Btn>
            </>
          }
        >
          <FRow>
            <FG label="Date *">
              <input type="date" value={markForm.date} onChange={e => pMark({ date: e.target.value })} />
            </FG>
            <FG label="Sport *">
              <select value={markForm.sportId} onChange={e => pMark({ sportId: e.target.value })}>
                <option value="">Select sport…</option>
                {activeSports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
              </select>
            </FG>
          </FRow>

          <FG label="Session *">
            <div style={{ display:'flex', gap:8 }}>
              {ATTENDANCE_SESSIONS.map(s => (
                <button
                  key={s.value} type="button"
                  onClick={() => pMark({ session: s.value })}
                  style={{
                    flex:1, padding:'10px', borderRadius:'var(--r)', fontSize:14, fontWeight:500,
                    border:`1.5px solid ${markForm.session === s.value ? 'var(--ac)' : 'var(--brd2)'}`,
                    background: markForm.session === s.value ? 'var(--acD)' : 'transparent',
                    color: markForm.session === s.value ? 'var(--ac)' : 'var(--tx2)',
                  }}
                >{s.label}</button>
              ))}
            </div>
          </FG>

          <FG label="Mark As">
            <div style={{ display:'flex', gap:8 }}>
              {ATTENDANCE_STATUSES.map(s => {
                const on = markForm.status === s.value
                const tone = s.value === 'PRESENT' ? 'gr' : 'rd'
                return (
                  <button
                    key={s.value} type="button"
                    onClick={() => pMark({ status: s.value })}
                    style={{
                      flex:1, padding:'8px', borderRadius:'var(--r)', fontSize:13, fontWeight:500,
                      border:`1.5px solid ${on ? `var(--${tone})` : 'var(--brd2)'}`,
                      background: on ? `var(--${tone}D)` : 'transparent',
                      color: on ? `var(--${tone})` : 'var(--tx2)',
                    }}
                  >{s.label}</button>
                )
              })}
            </div>
          </FG>

          <FG label="Players *">
            <PlayerMultiSelect selectedIds={markForm.playerIds} onChange={ids => pMark({ playerIds: ids })} />
          </FG>

          <FG label="Notes (optional)">
            <input value={markForm.notes} onChange={e => pMark({ notes: e.target.value })} placeholder="Any remarks for this session…" />
          </FG>
        </Modal>
      )}

      {/* ── Detail Modal ── */}
      {detail && (
        <Modal
          title="Attendance Detail"
          onClose={() => setDetail(null)}
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setDetail(null)}>Close</Btn>
              {canManage && <Btn variant="ghost" size="sm" onClick={() => openEdit(detail)}>Edit</Btn>}
              {canManage && <Btn variant="danger" size="sm" onClick={() => { setDelTarget(detail); setDetail(null) }}>Delete</Btn>}
            </>
          }
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, fontSize:13 }}>
            <div><div style={{ color:'var(--tx3)', fontSize:11, textTransform:'uppercase', marginBottom:4 }}>Player</div><strong>{detail.player?.name || '—'}</strong></div>
            <div><div style={{ color:'var(--tx3)', fontSize:11, textTransform:'uppercase', marginBottom:4 }}>Sport</div>{detail.sport ? <span>{detail.sport.icon} {detail.sport.name}</span> : '—'}</div>
            <div><div style={{ color:'var(--tx3)', fontSize:11, textTransform:'uppercase', marginBottom:4 }}>Date</div>{formatDate(detail.attendanceDate)}</div>
            <div><div style={{ color:'var(--tx3)', fontSize:11, textTransform:'uppercase', marginBottom:4 }}>Session</div><AttendanceSessionBadge session={detail.session} /></div>
            <div><div style={{ color:'var(--tx3)', fontSize:11, textTransform:'uppercase', marginBottom:4 }}>Status</div><AttendanceStatusBadge status={detail.status} /></div>
            <div><div style={{ color:'var(--tx3)', fontSize:11, textTransform:'uppercase', marginBottom:4 }}>Marked By</div>{detail.markedBy?.name || '—'}</div>
          </div>
          {detail.notes && (
            <div style={{ marginTop:16 }}>
              <div style={{ color:'var(--tx3)', fontSize:11, textTransform:'uppercase', marginBottom:4 }}>Notes</div>
              <div style={{ fontSize:13 }}>{detail.notes}</div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editForm && (
        <Modal
          title={`Edit Attendance — ${editForm.player?.name || ''}`}
          onClose={() => !editSaving && setEditForm(null)}
          footer={
            <>
              <Btn variant="ghost" size="sm" onClick={() => setEditForm(null)} disabled={editSaving}>Cancel</Btn>
              <Btn size="sm" loading={editSaving} onClick={saveEdit}>Save Changes</Btn>
            </>
          }
        >
          <FRow>
            <FG label="Date">
              <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
            </FG>
            <FG label="Sport">
              <select value={editForm.sport} onChange={e => setEditForm(f => ({ ...f, sport: e.target.value }))}>
                {sports.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
              </select>
            </FG>
          </FRow>
          <FRow>
            <FG label="Session">
              <select value={editForm.session} onChange={e => setEditForm(f => ({ ...f, session: e.target.value }))}>
                {ATTENDANCE_SESSIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FG>
            <FG label="Status">
              <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                {ATTENDANCE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FG>
          </FRow>
          <FG label="Notes">
            <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any remarks…" />
          </FG>
        </Modal>
      )}

      {/* ── Delete Confirmation ── */}
      {delTarget && (
        <ConfirmationModal
          title="Delete Attendance?"
          message={
            <>
              Are you sure you want to remove <strong>{delTarget.player?.name}</strong>'s attendance for{' '}
              <strong>{formatDate(delTarget.attendanceDate)} {ATTENDANCE_SESSION_LABEL[delTarget.session] || delTarget.session}</strong>?
            </>
          }
          confirmText="Delete"
          confirmVariant="danger"
          loading={deleting}
          onClose={() => setDelTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
