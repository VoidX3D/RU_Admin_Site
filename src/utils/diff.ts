export interface DiffLine {
  type: 'same' | 'add' | 'del'
  oldLine: number | null
  newLine: number | null
  text: string
}

export interface FileDiff {
  path: string
  status: 'modified' | 'added'
  oldContent: string | null
  newContent: string
  lines: DiffLine[]
}

function splitLines(s: string): string[] {
  return s.replace(/\r\n?/g, '\n').split('\n')
}

function normalizeFmt(s: string): string {
  return s.replace(/\r\n?/g, '\n').replace(/\n*$/, '\n')
}

// LCS-based line diff
export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const a = splitLines(normalizeFmt(oldText))
  const b = splitLines(normalizeFmt(newText))
  const m = a.length, n = b.length

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])

  const result: DiffLine[] = []
  let i = m, j = n
  const stack: DiffLine[] = []
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      stack.push({ type: 'same', oldLine: i, newLine: j, text: a[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', oldLine: null, newLine: j, text: b[j - 1] })
      j--
    } else {
      stack.push({ type: 'del', oldLine: i, newLine: null, text: a[i - 1] })
      i--
    }
  }
  while (stack.length > 0) result.push(stack.pop()!)
  return result
}

/** Parse + re-stringify to normalize formatting before diffing */
function normalizeJson(text: string): string {
  try { return JSON.stringify(JSON.parse(text), null, 2) }
  catch { return text }
}

export async function prepareFileDiffs(
  drafts: Record<string, unknown>[],
  fetchCurrent: (path: string) => Promise<string | null>,
): Promise<FileDiff[]> {
  const diffs: FileDiff[] = []

  for (const draft of drafts) {
    if (draft.type === 'mission') {
      const imageCount = (draft.imageCount as number) || (draft.images as { dataUrl: string; name: string }[])?.length || 0
      const filenames: string[] = Array.from({ length: imageCount }, (_, i) => `img-${String(i + 1).padStart(2, '0')}.jpg`)
      const stats = (draft.stats as { key: string; value: string }[]) || []
      const newJson = JSON.stringify({
        id: draft.id, title: draft.title, slug: draft.id, tag: draft.tag, date: draft.date,
        description: draft.description, detail: draft.detail, images: filenames,
        stats: stats.reduce((a, { key, value }) => ({ ...a, [key]: value }), {}),
        partners: draft.partners || [], show: draft.show !== false,
      }, null, 2)

      const infoPath = `src/mission/${draft.id}/info.json`
      const oldRaw = await fetchCurrent(infoPath)
      const oldContent = oldRaw !== null ? normalizeJson(oldRaw) : null
      const lines = oldContent !== null ? computeLineDiff(oldContent, newJson) : []
      diffs.push({ path: infoPath, status: oldContent ? 'modified' : 'added', oldContent, newContent: newJson, lines })

      const localImages = (draft.images as { dataUrl: string; name: string }[]) || []
      for (let i = 0; i < localImages.length; i++) {
        const imgPath = `src/mission/${draft.id}/img-${String(i + 1).padStart(2, '0')}.jpg`
        diffs.push({ path: imgPath, status: 'added', oldContent: null, newContent: '[binary: image]', lines: [] })
      }

    } else if (draft.type === 'announcement') {
      const annPath = `src/announcements/main/${draft.id}.json`
      const oldRaw = await fetchCurrent(annPath)
      let oldParsed: Record<string, unknown> = {}
      if (oldRaw !== null) { try { oldParsed = JSON.parse(oldRaw) } catch {} }

      const ann: Record<string, unknown> = {
        id: draft.id, title: draft.title, tag: draft.tag, date: draft.date,
        summary: draft.summary, description: draft.description, active: draft.active !== false,
      }
      for (const k of ['status', 'day', 'time', 'location', 'issuedBy', 'importance', 'instructions', 'deadline'] as const) {
        if (draft[k] !== undefined && draft[k] !== null && draft[k] !== '') ann[k] = draft[k]
      }

      const annImg = draft.image as { dataUrl: string; remote?: boolean } | null
      if (annImg && !annImg.remote) {
        ann.image = `/announcements/assets/${draft.id}-image.jpg`
        const imgPath = `src/announcements/assets/${draft.id}-image.jpg`
        diffs.push({ path: imgPath, status: 'added', oldContent: null, newContent: '[binary: image]', lines: [] })
      }

      // Preserve fields from the original file that we don't explicitly manage
      if (oldParsed.image && !ann.image) ann.image = oldParsed.image
      if (oldParsed.tags) ann.tags = oldParsed.tags
      if (oldParsed.gallery) ann.gallery = oldParsed.gallery
      if (oldParsed.deadline && !ann.deadline) ann.deadline = oldParsed.deadline

      const newJson = JSON.stringify(ann, null, 2)
      const oldContent = oldRaw !== null ? normalizeJson(oldRaw) : null
      const lines = oldContent !== null ? computeLineDiff(oldContent, newJson) : []
      diffs.push({ path: annPath, status: oldContent ? 'modified' : 'added', oldContent, newContent: newJson, lines })

    } else if (draft.type === 'members') {
      const newJson = JSON.stringify(draft, null, 2)
      const memPath = 'src/info/members.json'
      const oldRaw = await fetchCurrent(memPath)
      const oldContent = oldRaw !== null ? normalizeJson(oldRaw) : null
      const lines = oldContent !== null ? computeLineDiff(oldContent, newJson) : []
      diffs.push({ path: memPath, status: oldContent ? 'modified' : 'added', oldContent, newContent: newJson, lines })
    }
  }

  return diffs
}