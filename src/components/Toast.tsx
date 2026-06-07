import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { CheckCircleIcon, AlertCircleIcon, InfoIcon, AlertTriangleIcon, XIcon } from './Icons'

const VARIANTS = {
  success: { icon: CheckCircleIcon, bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', accent: 'var(--accent-dark)' },
  error: { icon: AlertCircleIcon, bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', accent: '#dc2626' },
  warning: { icon: AlertTriangleIcon, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', accent: '#d97706' },
  info: { icon: InfoIcon, bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', accent: '#2563eb' },
}

const toastVariants = {
  initial: { opacity: 0, x: 40, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } },
}

export function Toast() {
  const toasts = useStore(s => s.toasts)
  const remove = useStore(s => s.removeToast)

  return (
    <div className="toast-container">
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
              className="toast"
              style={{
                background: v.bg,
                borderColor: v.border,
                borderLeft: `3px solid ${v.accent}`,
              }}
              onClick={() => remove(t.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 28, height: 28, borderRadius: 8, background: v.accent + '18' }}>
                <Icon size={15} style={{ color: v.accent }} />
              </div>
              <span className="flex-1 text-sm leading-snug">{t.message}</span>
              <motion.button
                className="btn btn-ghost btn-icon btn-sm shrink-0"
                style={{ opacity: 0.5 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={e => { e.stopPropagation(); remove(t.id) }}
              >
                <XIcon size={12} />
              </motion.button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
