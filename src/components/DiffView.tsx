import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FileDiff, DiffLine } from '../utils/diff'
import { FileTextIcon, ImageIcon, ExternalLinkIcon, ChevronDownIcon, ChevronRightIcon } from './Icons'

function Line({ line }: { line: DiffLine }) {
 return (
 <div className={`flex items-start gap-2 px-3 py-0.5 text-[11px] leading-relaxed font-mono ${
 line.type === 'add' ? 'bg-emerald-50 dark:bg-emerald-50 dark:bg-emerald-500/5 text-emerald-700/80 dark:text-emerald-300/80' :
 line.type === 'del' ? 'bg-red-50 dark:bg-red-50 dark:bg-red-500/5 text-red-700/80 dark:text-red-300/80' :
 'text-zinc-500 dark:text-zinc-500'
 }`}>
 <span className="w-4 shrink-0 text-center text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-700 select-none">
 {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
 </span>
 {line.text}
 </div>
 )
}

function UnifiedDiff({ diff }: { diff: FileDiff }) {
 return (
 <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-50/50 dark:bg-zinc-950/50">
 {diff.lines.length === 0 ? (
 <div className="px-4 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-700">No content changes</div>
 ) : (
 diff.lines.map((l, i) => <Line key={i} line={l} />)
 )}
 </div>
 )
}

function DiffCard({ diff }: { diff: FileDiff }) {
 const [expanded, setExpanded] = useState(true)
 const isBinary = diff.path.endsWith('.jpg') || diff.path.endsWith('.png')

 return (
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 className="rounded-xl border border-zinc-200 dark:border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-50/50 dark:bg-zinc-900/30"
 >
 <button
 className="flex w-full items-center gap-2 px-4 py-3 text-left"
 onClick={() => setExpanded(!expanded)}
 >
 {isBinary
 ? <ImageIcon size={14} className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600" />
 : <FileTextIcon size={14} className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600" />
 }
 <span className="text-xs font-medium text-zinc-400 dark:text-zinc-700 dark:text-zinc-700 dark:text-zinc-300">{diff.path}</span>
 <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
 diff.status === 'added' ? 'bg-emerald-100 dark:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-600 dark:text-amber-400'
 }`}>
 {diff.status}
 </span>
 <span className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-700">
 {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
 </span>
 </button>
 {expanded && (
 <div className="border-t border-zinc-200 dark:border-zinc-200 dark:border-zinc-800/50">
 {isBinary ? (
 <div className="flex items-center gap-2 px-4 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600">
 <ImageIcon size={12} className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-700" />
 Binary file
 </div>
 ) : (
 <UnifiedDiff diff={diff} />
 )}
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
