import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { CheckCircleIcon, AlertCircleIcon, InfoIcon, AlertTriangleIcon, XIcon } from './Icons'

const VARIANTS = {
  success: { icon: CheckCircleIcon, bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', accent: '#16a34a' },
  error: { icon: AlertCircleIcon, bg: 'bg-red-500/10', border: 'border-red-500/25', accent: '#dc2626' },
  warning: { icon: AlertTriangleIcon, bg: 'bg-amber-500/10', border: 'border-amber-500/25', accent: '#d97706' },
  info: { icon: InfoIcon, bg: 'bg-blue-500/10', border: 'border-blue-500/25', accent: '#2563eb' },
}

const toastVariants = {
  initial: { opacity: 0, x: 40, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } },
}

export function Toast() {
  const toasts = useStore(s => s.toasts)
  const remove = useStore(s => s.removeToast)

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" style={{ maxWidth: 360 }}>
      <AnimatePresence>
        {toasts.map(t => {
          const v = VARIANTS[t.type]
          const Icon = v.icon
          return (
            <motion.div
              key={t.id}
              layout
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-lg shadow-black/30 ${v.bg} ${v.border}`}
              style={{ borderLeftWidth: 3, borderLeftColor: v.accent }}
              onClick={() => remove(t.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: v.accent + '18' }}>
                <Icon size={14} style={{ color: v.accent }} />
              </div>
              <span className="flex-1 text-xs leading-snug text-zinc-300">{t.message}</span>
              <motion.button
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={e => { e.stopPropagation(); remove(t.id) }}
              >
                <XIcon size={11} />
              </motion.button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
