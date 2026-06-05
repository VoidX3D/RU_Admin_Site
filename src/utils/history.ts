const HISTORY_KEY = 'publish_history'

export interface PublishFile {
  path: string
  status: 'modified' | 'added'
}

export interface PublishRecord {
  id: string
  date: string
  prUrl: string
  prNumber: number | null
  commitMessage: string
  files: PublishFile[]
  draftCount: number
  fileCount: number
  state?: 'open' | 'merged' | 'closed' | 'unknown'
  owner?: string
  repo?: string
}

export function savePublishRecord(record: PublishRecord) {
  const history = getPublishHistory()
  history.unshift(record)
  // Keep last 50 records
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
}

export function getPublishHistory(): PublishRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PublishRecord[]
  } catch {
    return []
  }
}

export function clearPublishHistory() {
  localStorage.removeItem(HISTORY_KEY)
}
