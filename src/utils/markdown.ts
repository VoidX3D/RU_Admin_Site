import { marked } from 'marked'
import katex from 'katex'
import DOMPurify from 'dompurify'

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
  const raw = marked.parse(md, {
    breaks: true,
    gfm: true,
  }) as string
  const withMath = renderMath(raw)
  const purified = DOMPurify.sanitize(withMath, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 's', 'em', 'strong', 'small', 'sub', 'sup',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
      'blockquote', 'pre', 'code', 'kbd', 'samp', 'var',
      'hr', 'div', 'span', 'a', 'img',
      'dl', 'dt', 'dd',
      'details', 'summary',
      'figure', 'figcaption',
      'del', 'ins', 'mark', 'abbr', 'cite',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title',
      'src', 'alt', 'width', 'height',
      'class', 'id',
      'colspan', 'rowspan', 'scope',
      'type', 'start',
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  })
  return purified
}
