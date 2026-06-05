import { useState } from 'react'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import { sha256 } from '../utils/crypto'
import { LeafIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon } from './Icons'

export function Login() {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const setAppUser = useStore(s => s.setUser)
  const setView = useStore(s => s.setView)

  async function handleLogin() {
    if (!user || !pass) { setError('Enter username and password'); return }
    setLoading(true); setError('')
    const s = Storage.getSettings()
    if (user !== s.username) { setError('Invalid credentials'); setLoading(false); return }
    const [h1, h2] = await Promise.all([sha256(s.password), sha256(pass)])
    if (h1 !== h2) { setError('Invalid credentials'); setLoading(false); return }
    setAppUser(user)
    Storage.saveSession(user)
    setView('dashboard')
  }

  const inpStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px 11px 42px',
    border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 15, outline: 'none',
    background: 'var(--bg)', color: 'var(--text)',
    fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: '-50%',
        background: 'radial-gradient(circle at 30% 20%, rgba(34,197,94,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(59,130,246,0.06) 0%, transparent 50%)',
      }} />
      <div style={{
        position: 'absolute', top: '8%', right: '8%', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '5%', width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
      }} />

      <div style={{
        background: '#fff', borderRadius: 20, padding: 40,
        width: '100%', maxWidth: 400,
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(34,197,94,0.25)',
          }}>
            <LeafIcon size={32} style={{ color: '#fff' }} />
          </div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, margin: '0 0 4px',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>RU Club Motherland</h1>
          <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500, margin: 0 }}>Admin Panel</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', color: '#dc2626', padding: '10px 14px',
            borderRadius: 10, fontSize: 13, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid #fecaca',
          }}>
            <LockIcon size={16} /> {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
              <UserIcon size={17} />
            </div>
            <input value={user} onChange={e => { setUser(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Username" autoFocus style={inpStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
              <LockIcon size={17} />
            </div>
            <input type={showPw ? 'text' : 'password'} value={pass}
              onChange={e => { setPass(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Password" style={inpStyle} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4 }}>
              {showPw ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
            </button>
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{
            width: '100%', padding: '12px', border: 'none', borderRadius: 10,
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}>
          {loading ? (
            <><div className="spinner spinner-white spinner-sm" /> Signing in...</>
          ) : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#94a3b8' }}>
          Restricted to authorized club members only
        </p>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          RU Club Motherland Admin Panel &middot; Built by <strong style={{ color: '#64748b' }}>Sincee Bhattarai</strong>
          <br />
          <span style={{ fontSize: 9 }}>RU Club Site Edition &middot; Content Management System</span>
        </p>
      </div>
    </div>
  )
}
