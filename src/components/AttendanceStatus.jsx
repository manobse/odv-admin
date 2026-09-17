import { Badge } from './ui'
import { ATTENDANCE_STATUS_LABEL, ATTENDANCE_STATUS_COLOR, ATTENDANCE_SESSION_LABEL } from '../constants/attendance'

export function AttendanceStatusBadge({ status }) {
  if (!status) return <span style={{ color:'var(--tx3)' }}>—</span>
  return <Badge variant={ATTENDANCE_STATUS_COLOR[status] || 'default'}>{ATTENDANCE_STATUS_LABEL[status] || status}</Badge>
}

export function AttendanceSessionBadge({ session }) {
  if (!session) return <span style={{ color:'var(--tx3)' }}>—</span>
  return <Badge variant={session === 'MORNING' ? 'amber' : 'blue'}>{ATTENDANCE_SESSION_LABEL[session] || session}</Badge>
}
