// Shared Attendance constants — mirrors ATTENDANCE_SESSIONS / ATTENDANCE_STATUSES
// in odv-admin-api/models/AttendanceModels.js
export const ATTENDANCE_SESSIONS = [
  { value: 'MORNING', label: 'Morning' },
  { value: 'EVENING', label: 'Evening' },
]
export const ATTENDANCE_SESSION_LABEL = Object.fromEntries(ATTENDANCE_SESSIONS.map(s => [s.value, s.label]))

export const ATTENDANCE_STATUSES = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT',  label: 'Absent'  },
]
export const ATTENDANCE_STATUS_LABEL = Object.fromEntries(ATTENDANCE_STATUSES.map(s => [s.value, s.label]))
export const ATTENDANCE_STATUS_COLOR = { PRESENT: 'green', ABSENT: 'red' }
