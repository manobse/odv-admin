import { useState, useEffect } from 'react'
import { useAsync } from '../hooks/useAsync'
import { playersApi } from '../api/client'
import { Btn, Spinner } from './ui'

// Players are searched server-side (not fully loaded into the browser) and results
// are capped at LIST_LIMIT — "Select All" only ever selects the players currently
// loaded, never phantom players outside that window.
const LIST_LIMIT = 100

// ── PlayerMultiSelect ────────────────────────────────────────────────────────
// Inline searchable multi-select checklist for picking players. Deliberately not a
// popup/dropdown — an always-visible block lays out cleanly at any viewport width,
// which is what makes it usable with touch on mobile without extra sheet/drawer plumbing.
export function PlayerMultiSelect({ selectedIds, onChange }) {
  const [query,     setQuery]     = useState('')
  const [debounced, setDebounced] = useState('')
  const [cache,     setCache]     = useState({})

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data, loading } = useAsync(
    () => playersApi.list({ page: 1, limit: LIST_LIMIT, ...(debounced ? { search: debounced } : {}) }),
    [debounced]
  )
  const players = data?.data || []
  const pg      = data?.pagination
  const hasMore = pg && pg.totalRecords > players.length

  // Cache every player object we've ever loaded so removable chips below can still
  // show a name after the search term changes and that player scrolls out of view.
  useEffect(() => {
    if (!players.length) return
    setCache(prev => {
      const next = { ...prev }
      players.forEach(pl => { next[pl._id] = pl })
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const selectedSet     = new Set(selectedIds)
  const selectedPlayers = selectedIds.map(id => cache[id]).filter(Boolean)
  const allVisibleSelected = players.length > 0 && players.every(pl => selectedSet.has(pl._id))

  function toggle(id) {
    onChange(selectedSet.has(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  }
  function selectAllVisible() {
    const ids = new Set(selectedIds)
    players.forEach(pl => ids.add(pl._id))
    onChange([...ids])
  }
  function clearAll() { onChange([]) }
  function remove(id) { onChange(selectedIds.filter(x => x !== id)) }

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="🔍 Search players by name, phone or email…"
        style={{ marginBottom:8 }}
      />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="ghost" size="xs" onClick={selectAllVisible} disabled={loading || players.length === 0 || allVisibleSelected}>
            Select All {debounced ? 'Matching' : 'Visible'} ({players.length})
          </Btn>
          <Btn variant="ghost" size="xs" onClick={clearAll} disabled={selectedIds.length === 0}>Clear All</Btn>
        </div>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--ac)' }}>
          Selected: {selectedIds.length}
        </div>
      </div>

      <div style={{ border:'1.5px solid var(--brd2)', borderRadius:'var(--r)', maxHeight:260, overflowY:'auto', background:'var(--bg2)' }}>
        {loading ? (
          <div style={{ padding:20, textAlign:'center' }}><Spinner /></div>
        ) : players.length === 0 ? (
          <div style={{ padding:'20px 14px', textAlign:'center', fontSize:13, color:'var(--tx3)' }}>
            {debounced ? 'No matching players found.' : 'No players found.'}
          </div>
        ) : players.map(pl => {
          const checked = selectedSet.has(pl._id)
          return (
            <div
              key={pl._id}
              onClick={() => toggle(pl._id)}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                borderBottom:'1px solid var(--brd)', cursor:'pointer',
                background: checked ? 'var(--acD)' : 'transparent',
              }}
            >
              <div style={{
                width:18, height:18, borderRadius:5, flexShrink:0,
                border:`2px solid ${checked ? 'var(--ac)' : 'var(--brd2)'}`,
                background: checked ? 'var(--ac)' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontSize:11,
              }}>
                {checked && '✓'}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {pl.name}{pl.nickname ? ` (${pl.nickname})` : ''}
                </div>
                <div style={{ fontSize:12, color:'var(--tx3)' }}>{pl.phone}</div>
              </div>
            </div>
          )
        })}
      </div>
      {hasMore && (
        <div style={{ fontSize:12, color:'var(--tx3)', marginTop:6 }}>
          Showing {players.length} of {pg.totalRecords} matching players — refine your search to find more.
        </div>
      )}

      {selectedPlayers.length > 0 && (
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>
            Selected Players ({selectedPlayers.length})
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {selectedPlayers.map(pl => (
              <span key={pl._id} style={{
                display:'inline-flex', alignItems:'center', gap:6, padding:'4px 6px 4px 10px',
                background:'var(--surf3)', borderRadius:40, fontSize:12.5,
              }}>
                {pl.name}
                <button
                  type="button"
                  onClick={() => remove(pl._id)}
                  aria-label={`Remove ${pl.name}`}
                  style={{ background:'none', color:'var(--tx3)', width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, padding:0 }}
                >✕</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
