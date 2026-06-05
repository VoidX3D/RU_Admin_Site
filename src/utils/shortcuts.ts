import { useEffect, useCallback } from 'react'

type Handler = (e: KeyboardEvent) => void

interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: Handler
  enabled?: boolean
}

export function useShortcuts(shortcuts: Shortcut[], deps: unknown[] = []) {
  const stable = useCallback(
    (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        if (s.enabled === false) continue
        const matchKey = e.key.toLowerCase() === s.key.toLowerCase()
        const matchCtrl = !!s.ctrl === (e.ctrlKey || e.metaKey)
        const matchShift = !!s.shift === e.shiftKey
        const matchAlt = !!s.alt === e.altKey
        if (matchKey && matchCtrl && matchShift && matchAlt) {
          e.preventDefault()
          s.handler(e)
          return
        }
      }
    },
    [shortcuts, ...deps]
  )

  useEffect(() => {
    window.addEventListener('keydown', stable)
    return () => window.removeEventListener('keydown', stable)
  }, [stable])
}

export const SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, label: 'Ctrl+S' },
  PUBLISH: { key: 'p', ctrl: true, shift: true, label: 'Ctrl+Shift+P' },
  DISCARD: { key: 'Escape', label: 'Esc' },
  NEW_MISSION: { key: '1', ctrl: true, label: 'Ctrl+1' },
  NEW_ANNOUNCEMENT: { key: '2', ctrl: true, label: 'Ctrl+2' },
  GOTO_DASHBOARD: { key: 'd', ctrl: true, label: 'Ctrl+D' },
  GOTO_MISSIONS: { key: 'm', ctrl: true, label: 'Ctrl+M' },
  GOTO_ANNOUNCEMENTS: { key: 'a', ctrl: true, label: 'Ctrl+A' },
  GOTO_MEMBERS: { key: 'u', ctrl: true, label: 'Ctrl+U' },
  GOTO_SETTINGS: { key: 's', ctrl: true, shift: true, label: 'Ctrl+Shift+S' },
} as const
