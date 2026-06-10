import { useRef, useState, useCallback, useEffect } from 'react'
import { marked } from 'marked'

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  label: string
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({ value, onChange, label, placeholder, minHeight = '160px' }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [renderedHtml, setRenderedHtml] = useState('')

  const renderMd = useCallback(async (md: string) => {
    if (!md) { setRenderedHtml(''); return }
    const html = await marked.parse(md)
    setRenderedHtml(html)
  }, [])

  useEffect(() => {
    if (showPreview) renderMd(value)
  }, [showPreview, value, renderMd])

  useEffect(() => {
    renderMd(value)
  }, [])

  const insert = useCallback((before: string, after = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.substring(start, end)
    const newText = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(newText)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }, [value, onChange])

  const insertBlock = useCallback((prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const line = value.substring(lineStart, value.indexOf('\n', start) > -1 ? value.indexOf('\n', start) : value.length)
    const newText = value.substring(0, lineStart) + prefix + line + '\n' + value.substring(lineStart + line.length)
    onChange(newText)
    setTimeout(() => ta.focus(), 0)
  }, [value, onChange])

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:', 'https://')
    if (!url) return
    const ta = textareaRef.current
    if (!ta) return
    const selected = value.substring(ta.selectionStart, ta.selectionEnd)
    const text = selected || 'link text'
    insert(`[${text}](${url})`, '')
    if (!selected) {
      setTimeout(() => {
        const pos = ta.value.indexOf(url)
        if (pos > -1) ta.setSelectionRange(pos, pos + 'link text'.length)
      }, 0)
    }
  }, [value, insert])

  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:', 'https://')
    if (!url) return
    insert(`![Image](${url})\n`, '')
  }, [insert])

  const id = `rte-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-[11px] font-medium text-zinc-500">{label}</label>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setShowPreview(!showPreview)}
            className="rounded-md px-2 py-0.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>
      <div className={`overflow-hidden rounded-lg border transition-colors ${focused ? 'border-emerald-500/50' : 'border-zinc-200 dark:border-zinc-700'}`}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-2 py-1.5">
          <TbBtn onClick={() => insert('**', '**')} title="Bold"><b>B</b></TbBtn>
          <TbBtn onClick={() => insert('*', '*')} title="Italic"><i>I</i></TbBtn>
          <TbBtn onClick={() => insert('***', '***')} title="Bold + Italic"><b><i>BI</i></b></TbBtn>
          <Divider />
          <TbBtn onClick={() => insertBlock('## ')}>H2</TbBtn>
          <TbBtn onClick={() => insertBlock('### ')}>H3</TbBtn>
          <Divider />
          <TbBtn onClick={() => insertBlock('- ')} title="Bullet list">&#8226;</TbBtn>
          <TbBtn onClick={() => insertBlock('1. ')} title="Numbered list">1.</TbBtn>
          <Divider />
          <TbBtn onClick={insertLink} title="Link">&#128279;</TbBtn>
          <TbBtn onClick={insertImage} title="Image">&#128247;</TbBtn>
          <Divider />
          <TbBtn onClick={() => insert('> ', '')} title="Blockquote">&ldquo;</TbBtn>
          <TbBtn onClick={() => insert('```\n', '\n```')} title="Code block">&lt;/&gt;</TbBtn>
          <Divider />
          <TbBtn onClick={() => insert('---\n', '')} title="Horizontal rule">&mdash;</TbBtn>
        </div>
        {showPreview ? (
          <div
            className="px-3 py-2 text-sm dark:text-white dark:bg-zinc-900/30 prose prose-sm dark:prose-invert max-w-none min-h-[160px]"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          <textarea
            id={id}
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || 'Start writing in Markdown...'}
            className="w-full resize-y border-0 bg-transparent px-3 py-2 text-sm font-mono dark:text-white outline-none"
            style={{ minHeight, fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace" }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        )}
      </div>
    </div>
  )
}

function TbBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md px-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
    >{children}</button>
  )
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-zinc-300 dark:border-zinc-700" />
}
