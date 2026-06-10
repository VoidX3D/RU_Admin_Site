import { useRef, useState, useCallback, useEffect } from 'react'

function toHtml(text: string): string {
  if (!text) return ''
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  return text.split(/\n\s*\n/).filter(Boolean).map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('')
}

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  label: string
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({ value, onChange, label, placeholder, minHeight = '160px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      initialized.current = true
      const html = toHtml(value)
      if (html) editorRef.current.innerHTML = html
    }
  }, [value])

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val)
    editorRef.current?.focus()
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const insertLink = useCallback(() => {
    const sel = window.getSelection()
    const url = prompt('Enter URL:', sel?.toString() ? '' : 'https://')
    if (url) exec('createLink', url)
  }, [exec])

  const id = `rte-${label.toLowerCase().replace(/\s+/g, '-')}`
  const showPlaceholder = !editorRef.current?.innerHTML || editorRef.current?.innerHTML === '<br>'

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[11px] font-medium text-zinc-500">{label}</label>
      <div className={`overflow-hidden rounded-lg border transition-colors ${focused ? 'border-emerald-500/50' : 'border-zinc-200 dark:border-zinc-700'}`}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-2 py-1.5">
          <TbBtn onClick={() => exec('bold')} title="Bold"><b>B</b></TbBtn>
          <TbBtn onClick={() => exec('italic')} title="Italic"><i>I</i></TbBtn>
          <TbBtn onClick={() => exec('underline')} title="Underline"><u>U</u></TbBtn>
          <Divider />
          <TbBtn onClick={() => exec('formatBlock', 'h2')}>H2</TbBtn>
          <TbBtn onClick={() => exec('formatBlock', 'h3')}>H3</TbBtn>
          <Divider />
          <TbBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">&#8226;</TbBtn>
          <TbBtn onClick={() => exec('insertOrderedList')} title="Numbered list">1.</TbBtn>
          <Divider />
          <TbBtn onClick={insertLink} title="Insert link">&#128279;</TbBtn>
        </div>
        <div
          id={id}
          ref={editorRef}
          contentEditable
          className="px-3 py-2 text-sm outline-none dark:text-white dark:bg-zinc-900/30 min-h-[160px]"
          style={{ minHeight }}
          onInput={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          suppressContentEditableWarning
        />
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
  return <span className="mx-0.5 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
}
