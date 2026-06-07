import { useEffect, useRef } from 'react'

type FormState = Record<string, unknown>

const PREFIX = 'ru_admin_autosave_'
const MAX_AUTOSAVE_ENTRIES = 20

function evictOldAutosaves() {
  try {
    const keys: { key: string; time: number }[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(PREFIX)) {
        try {
          const raw = localStorage.getItem(k)
          const data = raw ? JSON.parse(raw) as FormState : {}
          keys.push({ key: k, time: (data._savedAt as number) || 0 })
        } catch { keys.push({ key: k, time: 0 }) }
      }
    }
    if (keys.length > MAX_AUTOSAVE_ENTRIES) {
      keys.sort((a, b) => b.time - a.time)
      for (let i = MAX_AUTOSAVE_ENTRIES; i < keys.length; i++) {
        localStorage.removeItem(keys[i].key)
      }
    }
  } catch {}
}

export function useAutoSave(key: string, state: FormState, delay = 2000) {
  const prevRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const json = JSON.stringify({ ...state, _savedAt: Date.now() })
    if (json === prevRef.current) return
    prevRef.current = json
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(PREFIX + key, json)
        evictOldAutosaves()
      } catch { /* storage full — skip */ }
    }, delay)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [key, state, delay])
}

export function getAutoSaved<T = FormState>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const data = JSON.parse(raw) as T & { _savedAt?: number }
    delete (data as { _savedAt?: number })._savedAt
    return data as T
  } catch {
    return null
  }
}

export function clearAutoSave(key: string) {
  try { localStorage.removeItem(PREFIX + key) } catch {}
}
