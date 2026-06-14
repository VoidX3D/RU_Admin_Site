import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchRules, saveRules } from '../utils/supabase'
import { PageErrorBoundary } from './PageErrorBoundary'
import { ArrowLeftIcon, EyeIcon, EditIcon } from './Icons'
import { RichTextEditor } from './form'

type Mode = 'view' | 'edit'

export function RulesPage() {
  const addToast = useStore(s => s.addToast)
  const [mode, setMode] = useState<Mode>('view')
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchRules()
      if (data?.content) {
        setContent(data.content)
        setOriginalContent(data.content)
      }
    } catch (e) {
      console.error('[Rules] Load failed:', e)
      addToast('Failed to load rules', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!content.trim()) {
      addToast('Content cannot be empty', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await saveRules('club-rules', { content })
      if (error) { addToast(error.message, 'error'); return }
      setOriginalContent(content)
      addToast('Rules saved!', 'success')
      setMode('view')
    } catch (e) {
      addToast('Save failed: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" strokeWidth="3" stroke="currentColor" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading rules...</p>
        </div>
      </div>
    )
  }

  return (
    <PageErrorBoundary name="Club Rules" onReset={load}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Club Rules & Regulations</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">Single-page club rules — content renders as markdown on /rules</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'edit' ? (
              <>
                <button
                  className="rounded-lg border dark:border-zinc-800 min-h-[44px] sm:min-h-0 px-4 py-2 sm:px-3 sm:py-1.5 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200"
                  onClick={() => { setContent(originalContent); setMode('view') }}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-emerald-500 min-h-[44px] sm:min-h-0 px-5 py-2 sm:px-4 sm:py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save to Database'}
                </button>
              </>
            ) : (
              <button
                className="flex items-center gap-1.5 rounded-lg border dark:border-zinc-800 min-h-[44px] sm:min-h-0 px-4 py-2 sm:px-3 sm:py-1.5 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200"
                onClick={() => setMode('edit')}
              >
                <EditIcon size={14} />
                Edit Rules
              </button>
            )}
          </div>
        </div>

        {mode === 'edit' ? (
          <div className="rounded-lg border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <RichTextEditor
              value={content}
              onChange={setContent}
              label="Rules Content (Markdown)"
              placeholder="Enter club rules in markdown format..."
            />
          </div>
        ) : (
          <div className="rounded-lg border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            {content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{content.slice(0, 500)}...</pre>
                <p className="text-xs text-zinc-400 mt-4">
                  {content.length.toLocaleString()} characters &middot;{' '}
                  {content.split('\n').length} lines
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500 text-center py-10">No rules content yet. Click "Edit Rules" to add content.</p>
            )}
          </div>
        )}
      </motion.div>
    </PageErrorBoundary>
  )
}
