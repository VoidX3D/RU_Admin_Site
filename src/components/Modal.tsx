import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean; xl?: boolean }

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } },
}

export function Modal({ open, onClose, title, children, footer, wide, xl }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className={`modal${wide ? ' wide' : ''}${xl ? ' xl' : ''}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{title}</h3>
              <motion.button
                onClick={onClose}
                className="btn btn-ghost btn-icon"
                style={{ fontSize: 20, lineHeight: 1 }}
                whileHover={{ scale: 1.1, color: 'var(--red)' }}
                whileTap={{ scale: 0.9 }}
              >
                &times;
              </motion.button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
