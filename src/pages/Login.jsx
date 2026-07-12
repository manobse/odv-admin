import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(email, password)
      toast('Welcome back!', 'success')
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:58, height:58, margin:'0 auto 14px', borderRadius:14,
            background:'linear-gradient(135deg,#7c6fff,#2dd4bf)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--ffH)', fontWeight:800, fontSize:24, color:'#fff' }}>SP</div>
          <h1 style={{ fontFamily:'var(--ffH)', fontSize:28, fontWeight:800, marginBottom:6 }}>SportsPlex</h1>
          <p style={{ fontSize:14, color:'var(--text3)' }}>Admin Portal · Sign in to continue</p>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, padding:'32px 28px', boxShadow:'0 12px 48px rgba(0,0,0,.5)' }}>
          {/* Error */}
          {error && (
            <div style={{ background:'var(--redD)', color:'var(--red)', border:'1px solid rgba(255,87,87,.25)', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:20 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>Email address</label>
              <input
                type="email" value={email} required autoFocus
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>Password</label>
              <input
                type="password" value={password} required
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ padding:'12px', fontSize:15, fontWeight:600, borderRadius:8, border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'var(--surface3)' : '#7c6fff', color:'#fff',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow: loading ? 'none' : '0 2px 12px rgba(124,111,255,.4)', transition:'all .15s' }}>
              {loading && <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .6s linear infinite', display:'inline-block' }}/>}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* <div style={{ background:'rgba(124,111,255,.1)', border:'1px solid rgba(124,111,255,.2)', borderRadius:8, padding:'12px 14px', fontSize:12, color:'var(--text2)', lineHeight:1.8 }}>
            <strong style={{ color:'#7c6fff' }}>Demo credentials</strong><br />
            admin@sportsplex.in / admin123 (Super Admin)<br />
            manager@sportsplex.in / admin123 (Manager)<br />
            staff@sportsplex.in / admin123 (Staff)
          </div> */}
        </div>
      </div>
    </div>
  )
}
