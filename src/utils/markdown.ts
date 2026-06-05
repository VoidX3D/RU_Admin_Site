export function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const lines = html.split('\n')
  const out: string[] = []
  let inList = false

  for (const raw of lines) {
    let line = raw

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      if (inList) { out.push('</ul>'); inList = false }
      const level = heading[1].length
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }

    if (line.startsWith('---')) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push('<hr />')
      continue
    }

    const blockquote = line.match(/^>\s+(.+)$/)
    if (blockquote) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<blockquote>${inline(blockquote[1])}</blockquote>`)
      continue
    }

    if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${inline(line.slice(2))}</li>`)
      continue
    }

    const tableRow = line.match(/^\|(.+)\|$/)
    if (tableRow) {
      if (inList) { out.push('</ul>'); inList = false }
      const cells = tableRow[1].split('|').map(c => c.trim())
      if (cells.every(c => /^[-:]+$/.test(c.replace(/<[^>]+>/g, '')))) {
        continue
      }
      out.push(`<div style="display:flex;gap:8px">${cells.map(c => `<span style="flex:1;font-size:12px">${inline(c)}</span>`).join('')}</div>`)
      continue
    }

    if (line.trim() === '') {
      if (inList) { out.push('</ul>'); inList = false }
      out.push('')
      continue
    }

    if (inList) { out.push('</ul>'); inList = false }
    out.push(`<p>${inline(line)}</p>`)
  }

  if (inList) out.push('</ul>')

  return out.join('\n')
}

function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface-hover);padding:1px 5px;border-radius:4px;font-size:0.9em">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent)">$1</a>')
}
