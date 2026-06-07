import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon } from './Icons'

interface Props { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean; xl?: boolean }

const overlayVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { duration: 0.15 } },
}

const modalVariants = {
 hidden: { opacity: 0, scale: 0.96, y: 10 },
 visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
 exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } },
}

export function Modal({ open, onClose, title, children, footer, wide, xl }: Props) {
 return (
 <AnimatePresence>
 {open && (
 <motion.div
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
 variants={overlayVariants}
 initial="hidden"
 animate="visible"
 exit="hidden"
 onClick={onClose}
 >
 <motion.div
 className="w-full rounded-xl border border-zinc-200 dark:border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-white dark:bg-zinc-950 __S2XL__ shadow-black/5 dark:shadow-black/5 dark:shadow-black/40"
 style={{ maxWidth: xl ? 640 : wide ? 560 : 440 }}
 variants={modalVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 onClick={e => e.stopPropagation()}
 >
 <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-200 dark:border-zinc-800/50 px-4 py-3">
 <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
 <motion.button
 onClick={onClose}
 className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-400 dark:text-zinc-700 dark:hover:text-zinc-700 dark:text-zinc-300"
 whileHover={{ scale: 1.1, color: '#ef4444' }}
 whileTap={{ scale: 0.9 }}
 >
 <XIcon size={16} />
 </motion.button>
 </div>
 <div className="p-4">{children}</div>
 {footer && (
 <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-200 dark:border-zinc-800/50 px-4 py-3">
 {footer}
 </div>
 )}
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 )
}
