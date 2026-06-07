import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FileDiff } from '../utils/diff'
import { FileTextIcon, ImageIcon, ExternalLinkIcon, ChevronDownIcon, ChevronRightIcon } from './Icons'

function Line({ text, type }: { text: string; type: 'add' | 'del' | 'same' }) {
  return (
    <div className={`flex items-start gap-2 px-3 py-0.5 text-[11px] leading-relaxed font-mono ${
      type === 'add' ? 'bg-emerald-500/5 text-emerald-300/80' :
      type === 'del' ? 'bg-red-500/5 text-red-300/80' :
      'text-zinc-500'
    }`}>
      <span className="shrink-0 w-4 text-center text-zinc-700 select-none">
        {type === 'add' ? '+' : type === 'del' ? '-' : ' '}
      </span>
      {text}
    </div>
  )
}

function UnifiedDiff({ diff }: { diff: FileDiff }) {
  if (diff.binary) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-[11px] text-zinc-600">
        <ImageIcon size={12} className="text-zinc-700" />
        Binary file
      </div>
    )
  }

  const lines = diff.hunks.flatMap(h => {
    const result: { text: string; type: 'add' | 'del' | 'same' }[] = []
    for (const change of h.changes) {
      if (change.type === 'add') result.push({ text: change.content, type: 'add' })
      else if (change.type === 'del') result.push({ text: change.content, type: 'del' })
      else result.push({ text: change.content, type: 'same' })
    }
    return result
  })

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800/50 bg-zinc-950/50">
      {lines.length === 0 ? (
        <div className="px-4 py-2 text-[11px] text-zinc-700">No content changes</div>
      ) : (
        lines.map((l, i) => <Line key={i} type={l.type} text={l.text} />)
      )}
    </div>
  )
}

function DiffCard({ diff }: { diff: FileDiff }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-800/50 bg-zinc-900/30"
    >
      <button
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {diff.path.endsWith('.jpg') || diff.path.endsWith('.png')
          ? <ImageIcon size={14} className="text-zinc-600" />
          : <FileTextIcon size={14} className="text-zinc-600" />
        }
        <span className="text-xs font-medium text-zinc-300">{diff.path}</span>
        <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
          diff.status === 'added' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          {diff.status}
        </span>
        <span className="text-zinc-700">
          {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-zinc-800/50">
          <UnifiedDiff diff={diff} />
        </div>
      )}
    </motion.div>
  )
}

interface DiffViewProps {
  diffs: FileDiff[]
  commitMessage: string
  onCommitMessageChange: (msg: string) => void
  onPublish: () => void
  publishing: boolean
}

export function DiffView({ diffs, commitMessage, onCommitMessageChange, onPublish, publishing }: DiffViewProps) {
  return (
    <div>
      <div className="space-y-2">
        {diffs.map((diff, i) => <DiffCard key={diff.path + i} diff={diff} />)}
      </div>
    </div>
  )
}
