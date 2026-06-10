import { useRef, useState, useCallback, useEffect } from 'react'
import { renderMarkdown } from '../../utils/markdown'

type ViewMode = 'edit' | 'split' | 'preview'

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  label: string
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({ value, onChange, label, placeholder, minHeight = '200px' }: RichTextEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const mdTimer = useRef<ReturnType<typeof setTimeout>>()
  const [focused, setFocused] = useState(false)
  const [view, setView] = useState<ViewMode>('split')
  const [rendered, setRendered] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    clearTimeout(mdTimer.current)
    mdTimer.current = setTimeout(() => {
      if (view !== 'edit') setRendered(renderMarkdown(value))
    }, 100)
    const words = value.trim() ? value.trim().split(/\s+/).length : 0
    setWordCount(words)
    setCharCount(value.length)
    return () => clearTimeout(mdTimer.current)
  }, [value, view])

  useEffect(() => {
    if (view !== 'edit') setRendered(renderMarkdown(value))
  }, [])

  const insert = useCallback((before: string, after = '') => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart, end = ta.selectionEnd
    const sel = value.substring(start, end)
    onChange(value.substring(0, start) + before + sel + after + value.substring(end))
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + before.length
      ta.setSelectionRange(pos, pos + sel.length)
    })
  }, [value, onChange])

  const insertBlock = useCallback((prefix: string) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const lineEnd = value.indexOf('\n', start)
    const line = value.substring(lineStart, lineEnd > -1 ? lineEnd : value.length)
    onChange(value.substring(0, lineStart) + prefix + line + '\n' + value.substring(lineStart + line.length))
    requestAnimationFrame(() => ta.focus())
  }, [value, onChange])

  const insertAtCursor = useCallback((text: string, selectOffset = 0) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    onChange(value.substring(0, start) + text + value.substring(ta.selectionEnd))
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + text.length - selectOffset
      ta.setSelectionRange(pos - selectOffset, pos)
    })
  }, [value, onChange])

  const bold = useCallback(() => insert('**', '**'), [insert])
  const italic = useCallback(() => insert('*', '*'), [insert])
  const bi = useCallback(() => insert('***', '***'), [insert])
  const strike = useCallback(() => insert('~~', '~~'), [insert])
  const code = useCallback(() => insert('`', '`'), [insert])
  const link = useCallback(() => {
    const ta = taRef.current; if (!ta) return
    const sel = value.substring(ta.selectionStart, ta.selectionEnd)
    const url = prompt('URL:', 'https://') || ''; if (!url) return
    insert(`[${sel || 'link'}](${url})`)
  }, [value, insert])
  const img = useCallback(() => {
    const url = prompt('Image URL:', 'https://') || ''; if (!url) return
    insertAtCursor(`![Image](${url})\n`)
  }, [insertAtCursor])

  const table = useCallback(() => {
    const cols = prompt('Columns:', '3') || '3'
    const rows = prompt('Rows:', '3') || '3'
    const c = parseInt(cols) || 3, r = parseInt(rows) || 3
    let tbl = '\n'
    tbl += '| ' + Array.from({ length: c }, () => 'Header').join(' | ') + ' |\n'
    tbl += '| ' + Array.from({ length: c }, () => '---').join(' | ') + ' |\n'
    for (let i = 0; i < r - 1; i++) {
      tbl += '| ' + Array.from({ length: c }, () => ' ').join(' | ') + ' |\n'
    }
    insertAtCursor(tbl)
  }, [insertAtCursor])

  const mathInline = useCallback(() => insert('$', '$'), [insert])
  const mathBlock = useCallback(() => insertAtCursor('\n$$\n\n$$\n', 4), [insertAtCursor])

  const taskList = useCallback(() => insertBlock('- [ ] '), [insertBlock])
  const ordered = useCallback(() => insertBlock('1. '), [insertBlock])
  const bullet = useCallback(() => insertBlock('- '), [insertBlock])
  const quote = useCallback(() => insertBlock('> '), [insertBlock])
  const heading2 = useCallback(() => insertBlock('## '), [insertBlock])
  const heading3 = useCallback(() => insertBlock('### '), [insertBlock])
  const hr = useCallback(() => insertAtCursor('\n---\n'), [insertAtCursor])
  const codeBlock = useCallback(() => insertAtCursor('\n```\n\n```\n', 4), [insertAtCursor])
  const details = useCallback(() => insertAtCursor('\n<details><summary>Click</summary>\n\n</details>\n', 0), [insertAtCursor])

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') { e.preventDefault(); insert('  ') }
    if (!e.ctrlKey && !e.metaKey) return
    switch (e.key.toLowerCase()) {
      case 'b': e.preventDefault(); bold(); break
      case 'i': e.preventDefault(); italic(); break
      case 'k': e.preventDefault(); link(); break
      case 'd': e.preventDefault(); strike(); break
    }
  }, [bold, italic, link, strike, insert])

  const id = `rte-${label.toLowerCase().replace(/\s+/g, '-')}`

  const viewTabs: { key: ViewMode; label: string }[] = [
    { key: 'edit', label: 'Edit' },
    { key: 'split', label: 'Split' },
    { key: 'preview', label: 'Preview' },
  ]

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-[11px] font-medium text-zinc-500">{label}</label>
        <span className="text-[10px] text-zinc-400 tabular-nums">{wordCount}w · {charCount}c</span>
      </div>

      <div className={`overflow-hidden rounded-lg border transition-colors ${focused ? 'border-emerald-500/50' : 'border-zinc-200 dark:border-zinc-700'}`}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-2 py-1">
          {/* Text formatting */}
          <TbBtn onClick={bold} title="Bold Ctrl+B"><b>B</b></TbBtn>
          <TbBtn onClick={italic} title="Italic Ctrl+I"><i>I</i></TbBtn>
          <TbBtn onClick={bi} title="Bold+Italic"><b><i>BI</i></b></TbBtn>
          <TbBtn onClick={strike} title="Strikethrough Ctrl+D"><s>S</s></TbBtn>
          <TbBtn onClick={code} title="Inline code">&lt;/&gt;</TbBtn>
          <D />
          {/* Headings */}
          <TbBtn onClick={heading2}>H2</TbBtn>
          <TbBtn onClick={heading3}>H3</TbBtn>
          <D />
          {/* Lists */}
          <TbBtn onClick={bullet} title="Bullet list">&#8226;</TbBtn>
          <TbBtn onClick={ordered} title="Numbered list">1.</TbBtn>
          <TbBtn onClick={taskList} title="Task list">&#9744;</TbBtn>
          <TbBtn onClick={quote} title="Blockquote">&ldquo;</TbBtn>
          <D />
          {/* Insert */}
          <TbBtn onClick={link} title="Link Ctrl+K">&#128279;</TbBtn>
          <TbBtn onClick={img} title="Image">&#128247;</TbBtn>
          <TbBtn onClick={table} title="Table">&#9776;</TbBtn>
          <TbBtn onClick={codeBlock} title="Code block">&#9001;&#9002;</TbBtn>
          <TbBtn onClick={hr} title="Horizontal rule">&mdash;</TbBtn>
          <D />
          {/* Math */}
          <TbBtn onClick={mathInline} title="Inline math $...$">&sum;</TbBtn>
          <TbBtn onClick={mathBlock} title="Block math $$...$$">&int;</TbBtn>
          <D />
          <TbBtn onClick={details} title="Collapsible section">&#9654;</TbBtn>
          <TbBtn onClick={() => onChange('')} title="Clear">&#128465;</TbBtn>

          {/* View toggles */}
          <span className="ml-auto flex items-center gap-0.5 rounded-md border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5">
            {viewTabs.map(t => (
              <button key={t.key} type="button" onClick={() => setView(t.key)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${view === t.key ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>{t.label}</button>
            ))}
          </span>
        </div>

        {/* Body */}
        <div className="flex" style={{ minHeight }}>
          <textarea
            id={id}
            ref={taRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || 'Write in Markdown...'}
            onKeyDown={handleKey}
            className={`resize-none border-0 bg-transparent px-3 py-2 text-sm font-mono dark:text-white outline-none ${view === 'edit' ? 'w-full' : view === 'split' ? 'w-1/2 border-r dark:border-zinc-700' : 'hidden'}`}
            style={{ minHeight, fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Menlo', monospace", lineHeight: '1.6' }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {(view === 'split' || view === 'preview') && (
            <div
              className={`overflow-y-auto px-3 py-2 text-sm dark:text-white md-content ${view === 'split' ? 'w-1/2' : 'w-full'}`}
              style={{ minHeight, maxHeight: '60vh' }}
              dangerouslySetInnerHTML={{ __html: rendered }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function TbBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="flex min-h-[30px] min-w-[30px] items-center justify-center rounded-md px-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors"
    >{children}</button>
  )
}

function D() {
  return <span className="mx-0.5 h-4 w-px bg-zinc-300 dark:bg-zinc-600" />
}
