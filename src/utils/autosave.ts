import { useEffect, useRef } from 'react'

type FormState = Record<string, unknown>

const PREFIX = 'ru_admin_autosave_'

export function useAutoSave(key: string, state: FormState, delay = 2000) {
  const prevRef = useRef<string>('')

  useEffect(() => {
    const json = JSON.stringify(state)
    if (json === prevRef.current) return
    prevRef.current = json
    const timer = setTimeout(() => {
      try { localStorage.setItem(PREFIX + key, json) } catch { /* storage full */ }
    }, delay)
    return () => clearTimeout(timer)
  }, [key, state, delay])
}

export function getAutoSaved<T = FormState>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function clearAutoSave(key: string) {
  try { localStorage.removeItem(PREFIX + key) } catch { /* noop */ }
}
