import { AlertCircleIcon } from '../Icons'

interface TextareaProps {
 label: string
 value: string
 onChange: (val: string) => void
 placeholder?: string
 hint?: string
 error?: string | null
 rows?: number
 minRows?: number
 maxLength?: number
 className?: string
 monospace?: boolean
}

export function Textarea(props: TextareaProps) {
 const { label, value, onChange, placeholder, hint, error, rows = 4, maxLength, className, monospace } = props
 const id = `ta-${label.toLowerCase().replace(/\s+/g, '-')}`

 return (
 <div className={className || ''}>
 <label htmlFor={id} className="mb-1.5 flex items-center justify-between">
 <span className="block text-[11px] font-medium text-zinc-500">{label}</span>
 {maxLength && (
 <span className={`text-[11px] ${value.length > maxLength * 0.9 ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-600'}`}>
 {value.length}/{maxLength}
 </span>
 )}
 </label>
 <textarea
 id={id}
 value={value}
 onChange={e => onChange(e.target.value)}
 placeholder={placeholder}
 rows={rows}
 maxLength={maxLength}
 className={`w-full rounded-lg border bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:text-zinc-700 focus:border-emerald-500/50 ${error ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-800'} ${monospace ? 'font-mono' : ''}`}
 style={{ resize: 'vertical', minHeight: rows * 24 + 24 }}
 />
 {hint && !error && <div className="mt-1 text-[10px] text-zinc-500">{hint}</div>}
 {error && (
 <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
 <AlertCircleIcon size={12} /> {error}
 </div>
 )}
 </div>
 )
}
