import { useRef, useState, useCallback, useEffect } from 'react'
import { marked } from 'marked'

function toHtml(text: string): string {
  if (!text) return ''
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  return text.split(/\n\s*\n/).filter(Boolean).map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('')
}

function htmlToMarkdown(html: string): string {
  if (!html) return ''
  let md = html
  md = md.replace(/<h2[^>]*>/gi, '## ').replace(/<\/h2>/gi, '\n\n')
  md = md.replace(/<h3[^>]*>/gi, '### ').replace(/<\/h3>/gi, '\n\n')
  md = md.replace(/<strong[^>]*>/gi, '**').replace(/<\/strong>/gi, '**')
  md = md.replace(/<b[^>]*>/gi, '**').replace(/<\/b>/gi, '**')
  md = md.replace(/<em[^>]*>/gi, '*').replace(/<\/em>/gi, '*')
  md = md.replace(/<i[^>]*>/gi, '*').replace(/<\/i>/gi, '*')
  md = md.replace(/<u[^>]*>/gi, '<u>').replace(/<\/u>/gi, '</u>')
  md = md.replace(/<li[^>]*>/gi, '- ').replace(/<\/li>/gi, '\n')
  md = md.replace(/<ul[^>]*>/gi, '').replace(/<\/ul>/gi, '\n')
  md = md.replace(/<ol[^>]*>/gi, '').replace(/<\/ol>/gi, '\n')
  md = md.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n\n')
  md = md.replace(/<br\s*\/?>/gi, '\n')
  md = md.replace(/<a\s+href="([^"]+)"[^>]*>/gi, '[$1]($1) ').replace(/<\/a>/gi, '')
  md = md.replace(/<[^>]+>/g, '')
  md = md.replace(/\n{3,}/g, '\n\n')
  return md.trim()
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
  const sourceRef = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)
  const [mode, setMode] = useState<'visual' | 'html' | 'md'>('visual')
  const initialized = useRef(false)
  const [sourceText, setSourceText] = useState('')

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      initialized.current = true
      const html = toHtml(value)
      if (html) editorRef.current.innerHTML = html
    }
  }, [value])

  useEffect(() => {
    if (mode === 'html' && editorRef.current) {
      setSourceText(editorRef.current.innerHTML)
    }
    if (mode === 'md' && editorRef.current) {
      const html = editorRef.current.innerHTML
      setSourceText(htmlToMarkdown(html))
    }
  }, [mode])

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

  const handleSourceChange = useCallback((val: string) => {
    setSourceText(val)
    onChange(val)
  }, [onChange])

  const handleMdToHtml = useCallback(async () => {
    if (!sourceRef.current) return
    const mdText = sourceRef.current.value
    const html = await marked.parse(mdText)
    if (editorRef.current) {
      editorRef.current.innerHTML = html
      onChange(html)
    }
    setMode('visual')
  }, [onChange])

  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:')
    if (url) exec('insertImage', url)
  }, [exec])

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium text-zinc-500">{label}</label>
        <div className="flex items-center gap-0.5 rounded-lg border dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-0.5">
          <button type="button" onClick={() => setMode('visual')}
            className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${mode === 'visual' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Visual</button>
          <button type="button" onClick={() => setMode('html')}
            className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${mode === 'html' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>HTML</button>
          <button type="button" onClick={() => setMode('md')}
            className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${mode === 'md' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>MD</button>
        </div>
      </div>
      <div className={`overflow-hidden rounded-lg border transition-colors ${focused ? 'border-emerald-500/50' : 'border-zinc-200 dark:border-zinc-700'}`}>
        {mode === 'visual' && (
          <>
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
              <TbBtn onClick={insertLink} title="Link">&#128279;</TbBtn>
              <TbBtn onClick={insertImage} title="Image">&#128247;</TbBtn>
              <Divider />
              <TbBtn onClick={() => exec('formatBlock', 'p')} title="Remove formatting">&#8634;</TbBtn>
            </div>
            <div
              ref={editorRef}
              contentEditable
              className="px-3 py-2 text-sm outline-none dark:text-white dark:bg-zinc-900/30 min-h-[160px] prose prose-sm dark:prose-invert max-w-none [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-zinc-400 [&:empty:before]:pointer-events-none"
              style={{ minHeight }}
              data-placeholder={placeholder || 'Start writing...'}
              onInput={handleInput}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              suppressContentEditableWarning
            />
          </>
        )}
        {(mode === 'html' || mode === 'md') && (
          <div className="relative">
            <textarea
              ref={sourceRef}
              value={sourceText}
              onChange={e => handleSourceChange(e.target.value)}
              className="w-full resize-y border-0 bg-transparent px-3 py-2 text-sm font-mono dark:text-white outline-none"
              style={{ minHeight }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {mode === 'md' && (
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button type="button" onClick={handleMdToHtml}
                  className="rounded-md bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-400 shadow-sm">
                  Convert to HTML
                </button>
              </div>
            )}
          </div>
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
