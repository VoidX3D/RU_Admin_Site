export interface DraftData {
  id: string
  type: 'mission' | 'announcement'
  data: Record<string, unknown>
  savedAt: number
  label: string
}

const DRAFT_PREFIX = 'ru_admin_draft_'

export function loadDraft(key: string): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch (e) { console.error('[loadDraft] Failed:', key, e); return null }
}

export function saveDraft(key: string, draft: DraftData): void {
  try {
    localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify({ ...draft, savedAt: Date.now() }))
  } catch (e) {
    console.error('[saveDraft] Failed:', key, e)
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      const keys = listDraftKeys()
      const oldest = keys.sort((a, b) => (loadDraft(a)?.savedAt || 0) - (loadDraft(b)?.savedAt || 0))[0]
      if (oldest) removeDraft(oldest)
      try { localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify({ ...draft, savedAt: Date.now() })) } catch {}
    }
  }
}

export function removeDraft(key: string): void {
  try { localStorage.removeItem(DRAFT_PREFIX + key) } catch (e) { console.error('[removeDraft] Failed:', key, e) }
}

export function listDraftKeys(): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(DRAFT_PREFIX)) keys.push(k.slice(DRAFT_PREFIX.length))
    }
    return keys
  } catch (e) { console.error('[listDraftKeys] Failed:', e); return [] }
}

export function listDrafts(): DraftData[] {
  return listDraftKeys().map(k => loadDraft(k)).filter(Boolean) as DraftData[]
}

export function clearDrafts(): void {
  listDraftKeys().forEach(k => removeDraft(k))
}

export function getDraftAge(savedAt: number): string {
  const diff = Date.now() - savedAt
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
