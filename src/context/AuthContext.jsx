import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, saveToken, getToken } from '../api/client'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) { setLoading(false); return }
    authApi.me()
      .then(r => setUser(r.data))
      .catch(() => saveToken(''))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const r = await authApi.login(email, password)
    saveToken(r.token)
    setUser(r.data)
    return r.data
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch (_) {}
    saveToken('')
    setUser(null)
  }, [])

  const hasPerm = useCallback(
    perm => user?.role?.permissions?.includes(perm) ?? false,
    [user]
  )

  return (
    <Ctx.Provider value={{ user, loading, login, logout, hasPerm }}>
      {children}
    </Ctx.Provider>
  )
}
