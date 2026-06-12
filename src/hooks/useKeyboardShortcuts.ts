import { useEffect, useCallback } from 'react'
import { useStore } from '../store'

export interface Shortcut {
  keys: string
  description: string
  action: () => void
  category: 'navigation' | 'actions' | 'editing'
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const setView = useStore(s => s.setView)
  const setPendingAction = useStore(s => s.setPendingAction)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const el = e.target as HTMLElement
    const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable

    for (const shortcut of shortcuts) {
      const parts = shortcut.keys.toLowerCase().split('+')
      const ctrl = parts.includes('ctrl') || parts.includes('cmd')
      const shift = parts.includes('shift')
      const alt = parts.includes('alt')
      const key = parts[parts.length - 1]

      const matchCtrl = ctrl ? (e.ctrlKey || e.metaKey) : true
      const matchShift = shift ? e.shiftKey : !e.shiftKey
      const matchAlt = alt ? e.altKey : !e.altKey
      const matchKey = e.key.toLowerCase() === key

      if (matchCtrl && matchShift && matchAlt && matchKey) {
        if (isInput && !ctrl && !alt) continue
        if (shortcut.preventDefault !== false) e.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function getDefaultShortcuts(
  navigate: (view: string) => void,
  setPending: (action: string | null) => void,
  saveFn?: () => void,
): Shortcut[] {
  return [
    { keys: 'ctrl+1', description: 'New Mission', action: () => { setPending('newMission'); navigate('missions') }, category: 'actions' },
    { keys: 'ctrl+2', description: 'New Announcement', action: () => { setPending('newAnnouncement'); navigate('announcements') }, category: 'actions' },
    { keys: 'ctrl+d', description: 'Dashboard', action: () => navigate('dashboard'), category: 'navigation' },
    { keys: 'ctrl+m', description: 'Missions', action: () => navigate('missions'), category: 'navigation' },
    { keys: 'ctrl+u', description: 'Members', action: () => navigate('members'), category: 'navigation' },
    { keys: 'ctrl+shift+a', description: 'Announcements', action: () => navigate('announcements'), category: 'navigation' },
    { keys: 'ctrl+shift+c', description: 'Contact', action: () => navigate('contact'), category: 'navigation' },
    { keys: 'ctrl+shift+s', description: 'Settings', action: () => navigate('settings'), category: 'navigation' },
    { keys: 'ctrl+?', description: 'Show Shortcuts', action: () => navigate('help'), category: 'navigation' },
    { keys: 'ctrl+s', description: 'Save (in forms)', action: () => saveFn?.(), category: 'actions' },
  ]
}
