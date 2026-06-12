import { motion, AnimatePresence } from 'framer-motion'
import { XIcon, KeyboardIcon } from './Icons'
import type { Shortcut } from '../hooks/useKeyboardShortcuts'

interface ShortcutsHelpProps {
  open: boolean
  onClose: () => void
  shortcuts: Shortcut[]
}

export function ShortcutsHelp({ open, onClose, shortcuts }: ShortcutsHelpProps) {
  const categories = ['navigation', 'actions', 'editing'] as const
  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Quick Actions',
    editing: 'Editing',
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
              <div className="flex items-center justify-between border-b dark:border-zinc-700/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <KeyboardIcon size={16} className="dark:text-zinc-400" />
                  <h2 className="text-sm font-semibold dark:text-white">Keyboard Shortcuts</h2>
                </div>
                <button onClick={onClose} className="rounded-lg p-1 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <XIcon size={14} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                <p className="mb-4 text-[10px] dark:text-zinc-500 leading-relaxed">
                  Press <kbd className="rounded border dark:border-zinc-600 px-1 py-0.5 text-[9px] dark:bg-zinc-800 dark:text-zinc-300">Ctrl</kbd> + <kbd className="rounded border dark:border-zinc-600 px-1 py-0.5 text-[9px] dark:bg-zinc-800 dark:text-zinc-300">?</kbd> to open this panel anytime.
                  Shortcuts work globally except when typing in text fields.
                </p>
                {categories.map(cat => {
                  const catShortcuts = shortcuts.filter(s => s.category === cat)
                  if (catShortcuts.length === 0) return null
                  return (
                    <div key={cat} className="mb-4 last:mb-0">
                      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider dark:text-zinc-500">{categoryLabels[cat]}</h3>
                      <div className="space-y-1">
                        {catShortcuts.map((s, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg dark:bg-zinc-800/50 px-3 py-1.5">
                            <span className="text-xs dark:text-zinc-300">{s.description}</span>
                            <span className="text-[10px] font-mono dark:text-zinc-500">
                              {s.keys.split('+').map((k, j) => (
                                <span key={j}>
                                  {j > 0 && <span className="mx-0.5">+</span>}
                                  <kbd className="rounded border dark:border-zinc-600 px-1 py-0.5 dark:bg-zinc-800 dark:text-zinc-400">{k === 'cmd' ? 'Ctrl' : k === 'ctrl' ? 'Ctrl' : k.toUpperCase()}</kbd>
                                </span>
                              ))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t dark:border-zinc-700/50 px-4 py-2.5 text-center">
                <p className="text-[10px] dark:text-zinc-600">Press <kbd className="rounded border dark:border-zinc-600 px-1 py-0.5 text-[9px] dark:bg-zinc-800 dark:text-zinc-400">Esc</kbd> to close</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
