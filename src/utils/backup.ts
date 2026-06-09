export function exportBackup(): string {
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('ru_admin_')) {
      try { data[key] = JSON.parse(localStorage.getItem(key) || '') } catch { data[key] = localStorage.getItem(key) }
    }
  }
  return JSON.stringify({ version: 1, exported: new Date().toISOString(), data }, null, 2)
}

export function importBackup(json: string): { ok: boolean; message: string } {
  try {
    const backup = JSON.parse(json)
    if (!backup.data || typeof backup.data !== 'object') return { ok: false, message: 'Invalid backup format' }
    for (const [key, val] of Object.entries(backup.data)) {
      try { localStorage.setItem(key, JSON.stringify(val)) } catch { return { ok: false, message: `Failed to restore ${key}` } }
    }
    return { ok: true, message: `Backup imported successfully (${Object.keys(backup.data).length} items)` }
  } catch {
    return { ok: false, message: 'Invalid JSON file' }
  }
}
