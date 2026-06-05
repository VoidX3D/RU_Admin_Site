import { Storage } from './storage'
import type { Draft, Settings } from '../types'

interface BackupData {
  version: number
  exportedAt: string
  drafts: Draft[]
  settings: Settings | null
}

export function exportBackup(): string {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    drafts: Storage.listDrafts(),
    settings: Storage.getSettings(),
  }
  return JSON.stringify(data, null, 2)
}

export function importBackup(json: string): { ok: boolean; message: string } {
  try {
    const data = JSON.parse(json) as BackupData
    if (!data.version || !Array.isArray(data.drafts)) {
      return { ok: false, message: 'Invalid backup format' }
    }
    for (const draft of data.drafts) {
      if (draft.id && draft.type) {
        const stored = Storage.getDraft(draft.type, draft.id)
        if (stored) {
          Object.assign(stored, draft)
        }
      }
    }
    if (data.settings) {
      Storage.saveSettings(data.settings)
    }
    return { ok: true, message: `Imported ${data.drafts.length} draft(s) and settings.` }
  } catch {
    return { ok: false, message: 'Failed to parse backup file' }
  }
}
