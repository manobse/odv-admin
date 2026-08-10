import { Badge } from './ui'
import { CHARGE_TYPES, CHARGE_TYPE_LABEL, CHARGE_TYPE_COLOR } from '../constants/chargeTypes'

export function ChargeTypeBadge({ type }) {
  if (!type) return <span style={{ color:'var(--text3)' }}>—</span>
  return <Badge variant={CHARGE_TYPE_COLOR[type] || 'default'}>{CHARGE_TYPE_LABEL[type] || type}</Badge>
}

export function ChargeTypeSelect({ value, onChange, options = CHARGE_TYPES }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {options.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
    </select>
  )
}
