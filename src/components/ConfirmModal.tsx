import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangleIcon, XIcon } from './Icons'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  dangerous?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', dangerous = true, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="mx-4 w-full max-w-sm overflow-hidden rounded-xl border dark:border-zinc-700/50 bg-white dark:bg-zinc-950 shadow-2xl dark:shadow-black/60"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b dark:border-zinc-800/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon size={16} className={dangerous ? 'text-red-500' : 'text-amber-500'} />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
              </div>
              <button
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-8"
                onClick={onCancel}
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{message}</p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t dark:border-zinc-800/50 px-4 py-3">
              <button
                className="rounded-lg border dark:border-zinc-800 min-h-[44px] sm:min-h-0 px-4 py-2 sm:px-3 sm:py-1.5 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
              <button
                className={`rounded-lg min-h-[44px] sm:min-h-0 px-5 py-2 sm:px-4 sm:py-1.5 text-xs font-semibold text-white ${
                  dangerous
                    ? 'bg-red-500 hover:bg-red-400'
                    : 'bg-emerald-500 hover:bg-emerald-400'
                }`}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}