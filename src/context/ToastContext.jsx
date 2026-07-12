import { createContext, useContext, useState, useCallback } from 'react'

const Ctx = createContext(null)
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const colors = { success: 'var(--gr)', error: 'var(--rd)', info: 'var(--ac)', warning: 'var(--am)' }
  const icons  = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background:'var(--surf)', border:'1px solid var(--brd2)',
            borderRadius:'var(--r2)', padding:'12px 18px',
            boxShadow:'var(--shL)', display:'flex', alignItems:'center', gap:10,
            fontSize:14, animation:'fadeUp .25s ease', maxWidth:340, minWidth:200,
          }}>
            <span style={{ fontSize:16, color:colors[t.type]||colors.info, fontWeight:700 }}>
              {icons[t.type]||icons.info}
            </span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
