import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore, checkLoginRateLimit, resetLoginRateLimit } from '../store'
import { Storage } from '../utils/storage'
import { login } from '../utils/supabase'

const FLOATING_WORDS = ['RU', 'Club', 'Motherland', 'Admin', 'Sincee', 'Content']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function Login() {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const setAppUser = useStore(s => s.setUser)
  const setView = useStore(s => s.setView)

  useEffect(() => { setMounted(true) }, [])

  // Canvas animation for the left panel
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = canvas.width = window.innerWidth * 0.55
    let h = canvas.height = window.innerHeight
    let t = 0

    const resize = () => {
      w = canvas.width = window.innerWidth * 0.55
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)

    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; hue: number }[] = []
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 3 + 1,
        a: Math.random() * 0.4 + 0.1,
        hue: 140 + Math.random() * 30,
      })
    }

    let animId: number
    const draw = () => {
      t += 0.003
      ctx.clearRect(0, 0, w, h)

      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, '#020617')
      grad.addColorStop(0.5, '#030712')
      grad.addColorStop(1, '#020617')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < 3; i++) {
        const cx = w * (0.2 + i * 0.3) + Math.sin(t + i * 2) * 40
        const cy = h * (0.3 + (i % 2) * 0.3) + Math.cos(t * 0.7 + i) * 30
        const r = 120 + Math.sin(t + i) * 30
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, `rgba(34, 197, 94, ${0.04 + Math.sin(t + i) * 0.02})`)
        g.addColorStop(0.5, `rgba(34, 197, 94, ${0.02 + Math.sin(t * 0.5 + i) * 0.01})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.015)'
      ctx.lineWidth = 1
      const step = 50
      for (let x = -step; x < w + step; x += step) {
        ctx.beginPath()
        ctx.moveTo(x + Math.sin(t + x * 0.005) * 8, 0)
        ctx.lineTo(x + Math.sin(t + x * 0.005) * 8, h)
        ctx.stroke()
      }
      for (let y = -step; y < h + step; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y + Math.cos(t * 0.7 + y * 0.005) * 8)
        ctx.lineTo(w, y + Math.cos(t * 0.7 + y * 0.005) * 8)
        ctx.stroke()
      }

      particles.forEach(p => {
        p.x += p.vx + Math.sin(t + p.hue) * 0.1
        p.y += p.vy + Math.cos(t * 0.5 + p.hue) * 0.1
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 50%, 60%, ${p.a * (0.6 + Math.sin(t * 2 + p.hue) * 0.4)})`
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(34, 197, 94, ${0.06 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  async function handleLogin() {
    if (!user || !pass) { setError('Enter username and password'); return }
    const delay = checkLoginRateLimit()
    if (delay > 0) {
      setError(`Too many attempts. Try again in ${Math.ceil(delay / 1000)}s`)
      return
    }
    setLoading(true); setError('')

    try {
      const result = await login(user, pass)
      if (result.token) {
        resetLoginRateLimit()
        Storage.saveSession(result.user || user)
        Storage.saveToken(result.token)
        setAppUser(result.user || user)
        setView('dashboard')
      } else {
        setError(result.error || 'Invalid credentials')
        setLoading(false)
      }
    } catch {
      setError('Connection error. Check API availability.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex dark:bg-zinc-950">
      {/* Left Panel — Animated Background */}
      <div className="relative hidden w-[55%] overflow-hidden lg:block">
        <canvas ref={canvasRef} className="absolute inset-0" />

        {/* Overlay on canvas */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center p-16"
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 ring-1 ring-emerald-500/20 backdrop-blur-xl"
            animate={mounted ? {
              scale: [1, 1.05, 1],
              boxShadow: ['0 0 0 0 rgba(34,197,94,0)', '0 0 40px 10px rgba(34,197,94,0.15)', '0 0 0 0 rgba(34,197,94,0)'],
            } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-2xl font-extrabold text-emerald-400">RU</span>
          </motion.div>

          <motion.h2
            className="mb-2 text-center text-4xl font-bold tracking-tight text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            RU Club Motherland
          </motion.h2>
          <motion.p
            className="text-center text-base text-zinc-500"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Content Management System
          </motion.p>

          {/* Floating words */}
          <div className="mt-16 flex flex-wrap justify-center gap-2">
            {FLOATING_WORDS.map((word, i) => (
              <motion.span
                key={word}
                className="rounded-full border border-zinc-700/50 bg-zinc-800/30 px-3 py-1 text-[11px] font-medium text-zinc-500 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? {
                  opacity: 1,
                  y: [0, -4, 0],
                } : {}}
                transition={{
                  duration: 0.5, delay: 0.7 + i * 0.08,
                  y: { duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                {word}
              </motion.span>
            ))}
          </div>

          <motion.div
            className="absolute bottom-16 left-0 right-0 text-center"
            initial={{ opacity: 0 }}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.5 }}
          >
            <p className="text-[11px] leading-relaxed text-zinc-500">
              RU Administration
              <br />
              <span className="text-[9px]">VoidX3D &mdash; <a href="https://github.com/VoidX3D" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400">GitHub</a></span>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex flex-1 items-center justify-center dark:bg-zinc-950 p-6">
        <motion.div
          className="w-full max-w-sm"
          variants={containerVariants}
          initial="hidden"
          animate={mounted ? 'visible' : 'hidden'}
        >
          {/* Mobile logo */}
          <motion.div className="mb-8 text-center lg:hidden" variants={itemVariants}>
            <motion.div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-lg font-bold text-white">RU</span>
            </motion.div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">RU Club Motherland</h1>
            <p className="mt-0.5 text-xs text-zinc-500">Admin Panel</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Welcome back</h2>
            <p className="mt-1 text-xs text-zinc-500">Sign in to access the admin panel</p>
          </motion.div>

          <motion.div className="mt-8 space-y-5" variants={itemVariants}>
            {error && (
              <motion.div
                className="flex items-center gap-2 rounded-lg border dark:border-red-900/50 dark:bg-red-950/50 px-3 py-2.5 text-sm dark:text-red-400"
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </motion.div>
            )}

            <div>
                    <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase">Email or Username</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 dark:text-zinc-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <input
                        value={user}
                        onChange={e => { setUser(e.target.value); setError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        placeholder="admin@example.com"
                        autoFocus
                        className="w-full rounded-lg border dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-2.5 pl-10 pr-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                      />
                    </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 dark:text-zinc-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={e => { setPass(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-2.5 pl-10 pr-10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 dark:text-zinc-600 hover:text-zinc-400 dark:hover:text-zinc-400"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <motion.button
              onClick={handleLogin}
              disabled={loading}
              className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="mt-8 text-center text-[11px] dark:text-zinc-700"
            variants={itemVariants}
          >
            Restricted to authorized club members only
          </motion.p>

          <motion.div
            className="mt-6 border-t dark:border-zinc-800/50 pt-5 text-center lg:hidden"
            variants={itemVariants}
          >
            <p className="text-[10px] leading-relaxed text-zinc-500">
              RU Club Motherland &middot; <a href="https://github.com/VoidX3D" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">VoidX3D</a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
