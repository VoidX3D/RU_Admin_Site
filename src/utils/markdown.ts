import { marked } from 'marked'
import katex from 'katex'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderMath(text: string): string {
  let result = ''
  let i = 0
  const len = text.length
  while (i < len) {
    if (text[i] === '$') {
      if (i + 2 < len && text[i + 1] === '$' && text[i + 2] !== ' ') {
        const end = text.indexOf('$$', i + 2)
        if (end !== -1) {
          const expr = text.slice(i + 2, end).trim()
          try {
            result += katex.renderToString(expr, { displayMode: true, throwOnError: false })
          } catch {
            result += `<div class="katex-error">${escapeHtml(expr)}</div>`
          }
          i = end + 2
          continue
        }
      } else if (text[i + 1] !== ' ' && (i === 0 || text[i - 1] !== '$')) {
        const end = text.indexOf('$', i + 1)
        if (end !== -1 && text[end + 1] !== '$') {
          const expr = text.slice(i + 1, end).trim()
          if (expr.length > 0) {
            try {
              result += katex.renderToString(expr, { displayMode: false, throwOnError: false })
            } catch {
              result += `<span class="katex-error">${escapeHtml(expr)}</span>`
            }
            i = end + 1
            continue
          }
        }
      }
    }
    result += text[i]
    i++
  }
  return result
}

export function renderMarkdown(md: string): string {
  if (!md.trim()) return ''
  const html = marked.parse(md, {
    breaks: true,
    gfm: true,
  }) as string
  return renderMath(html)
}
