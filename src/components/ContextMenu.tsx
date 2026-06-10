import { useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ContextAction {
  icon?: ReactNode
  label: string
  shortcut?: string
  onClick: () => void
  dangerous?: boolean
  disabled?: boolean
}

interface Props {
  open: boolean
  x: number
  y: number
  onClose: () => void
  actions: ContextAction[]
}

export function ContextMenu({ open, x, y, onClose, actions }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - actions.length * 36 - 16)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          className="fixed z-[100] min-w-[180px] overflow-hidden rounded-xl border dark:border-zinc-700/50 bg-white dark:bg-zinc-900 shadow-2xl dark:shadow-black/60"
          style={{ left: adjustedX, top: adjustedY }}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                action.dangerous
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              } ${action.disabled ? 'opacity-40 pointer-events-none' : ''}`}
              onClick={() => { action.onClick(); onClose() }}
            >
              {action.icon && <span className="flex w-4 shrink-0 items-center justify-center">{action.icon}</span>}
              <span className="flex-1">{action.label}</span>
              {action.shortcut && (
                <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{action.shortcut}</span>
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}