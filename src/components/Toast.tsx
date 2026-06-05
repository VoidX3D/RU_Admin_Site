import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { CheckCircleIcon, AlertCircleIcon, InfoIcon, AlertTriangleIcon, XIcon } from './Icons'

const VARIANTS = {
  success: { cls: 'toast-success', icon: CheckCircleIcon, bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', accent: 'var(--accent-dark)' },
  error: { cls: 'toast-error', icon: AlertCircleIcon, bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', accent: '#dc2626' },
  warning: { cls: 'toast-warning', icon: AlertTriangleIcon, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', accent: '#d97706' },
  info: { cls: 'toast-info', icon: InfoIcon, bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', accent: '#2563eb' },
}

export function Toast() {
  const toasts = useStore(s => s.toasts)
  const remove = useStore(s => s.removeToast)
  const [exiting, setExiting] = useState<Set<string>>(new Set())

  if (!toasts.length) return null

  return (
    <div className="toast-container">
      {toasts.map(t => {
        const v = VARIANTS[t.type]
        const Icon = v.icon
        const isExiting = exiting.has(t.id)
        return (
          <div key={t.id}
            className={`toast ${v.cls}`}
            style={{
              animation: isExiting ? 'slideOut 0.2s ease forwards' : 'slideIn 0.25s ease',
              background: v.bg,
              borderColor: v.border,
              borderLeft: `3px solid ${v.accent}`,
            }}
            onClick={() => {
              setExiting(prev => new Set(prev).add(t.id))
              setTimeout(() => remove(t.id), 200)
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: v.accent + '18',
              flexShrink: 0,
            }}>
              <Icon size={15} style={{ color: v.accent }} />
            </div>
            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>{t.message}</span>
            <button className="btn btn-ghost btn-icon btn-sm" style={{ flexShrink: 0, opacity: 0.5 }}>
              <XIcon size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
