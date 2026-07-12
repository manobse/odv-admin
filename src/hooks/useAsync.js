import { useState, useEffect, useCallback, useRef } from 'react'

export function useAsync(fn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const alive = useRef(true)

  const run = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await fn()
      if (alive.current) setData(r)
    } catch (e) {
      if (alive.current) setError(e.message)
    } finally {
      if (alive.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    alive.current = true
    run()
    return () => { alive.current = false }
  }, [run])

  return { data, loading, error, reload: run }
}
