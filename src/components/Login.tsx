import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, checkLoginRateLimit, resetLoginRateLimit } from '../store'
import { Storage } from '../utils/storage'
import { sha256 } from '../utils/crypto'
import { AnimatedBackground } from './AnimatedBackground'

export function Login() {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAppUser = useStore(s => s.setUser)
  const setView = useStore(s => s.setView)

  async function handleLogin() {
    if (!user || !pass) { setError('Enter username and password'); return }

    const delay = checkLoginRateLimit()
    if (delay > 0) {
      setError(`Too many attempts. Try again in ${Math.ceil(delay / 1000)}s`)
      return
    }

    setLoading(true); setError('')
    const s = Storage.getSettings()
    if (user !== s.username) { setError('Invalid credentials'); setLoading(false); return }
    const [h1, h2] = await Promise.all([sha256(s.password), sha256(pass)])
    if (h1 !== h2) { setError('Invalid credentials'); setLoading(false); return }

    resetLoginRateLimit()
    setAppUser(user)
    Storage.saveSession(user)
    setView('dashboard')
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" style={{ zIndex: 1 }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" style={{ zIndex: 1 }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/8 via-transparent to-transparent" style={{ zIndex: 1 }} />

      <motion.div
        className="relative z-10 flex min-h-screen items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="group relative rounded-2xl border border-zinc-800/50 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl"
            whileHover={{ borderColor: 'rgba(34,197,94,0.2)' }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500/[0.03] to-transparent pointer-events-none" />

            <motion.div
              className="relative mb-8 text-center"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20"
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-xl font-bold text-white">RU</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <h1 className="text-xl font-bold tracking-tight text-white">
                  RU Club Motherland
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Admin Panel
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              {error && (
                <motion.div
                  className="mb-4 flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/50 px-3 py-2.5 text-sm text-red-400"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  layout
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Username
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <input
                      value={user}
                      onChange={e => { setUser(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="Enter your username"
                      autoFocus
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-800/30 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-zinc-800/50 focus:ring-1 focus:ring-emerald-500/20"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
                >
                  <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input
                      type="password"
                      value={pass}
                      onChange={e => { setPass(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-800/30 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-zinc-800/50 focus:ring-1 focus:ring-emerald-500/20"
                    />
                  </div>
                </motion.div>
              </div>

              <motion.button
                onClick={handleLogin}
                disabled={loading}
                className="relative mt-6 w-full overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.99 } : {}}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={loading ? { x: '200%' } : { x: '-100%' }}
                  transition={{ duration: 0.8, repeat: loading ? Infinity : 0, ease: 'linear' }}
                />
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </motion.div>

            <motion.p
              className="relative mt-6 text-center text-xs text-zinc-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              Restricted to authorized club members only
            </motion.p>

            <motion.div
              className="relative mt-6 border-t border-zinc-800/50 pt-5 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <p className="text-[10px] leading-relaxed text-zinc-700">
                RU Club Motherland Admin Panel &middot; Built by <span className="font-medium text-zinc-500">Sincee Bhattarai</span>
                <br />
                <span className="text-[9px]">RU Club Site Edition &middot; Content Management System</span>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
