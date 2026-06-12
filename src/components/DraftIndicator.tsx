import { useEffect, useState } from 'react'
import { getDraftAge } from '../utils/drafts'

interface DraftIndicatorProps {
  savedAt: number
  onClearDraft: () => void
}

export function DraftIndicator({ savedAt, onClearDraft }: DraftIndicatorProps) {
  const [age, setAge] = useState('')

  useEffect(() => {
    setAge(getDraftAge(savedAt))
    const interval = setInterval(() => setAge(getDraftAge(savedAt)), 15000)
    return () => clearInterval(interval)
  }, [savedAt])

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 shrink-0">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
        Draft saved {age}
      </span>
      <button
        onClick={onClearDraft}
        className="ml-1 rounded p-0.5 text-amber-500 hover:text-red-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        title="Clear draft"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
