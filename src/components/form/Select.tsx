import { ChevronDownIcon } from '../Icons'

interface SelectProps {
 label: string
 value: string
 onChange: (val: string) => void
 options: { value: string; label: string }[]
 hint?: string
 placeholder?: string
}

export function Select(props: SelectProps) {
 const { label, value, onChange, options, hint, placeholder } = props
 const id = `sel-${label.toLowerCase().replace(/\s+/g, '-')}`
 return (
 <div>
 <label htmlFor={id} className="mb-1.5 block text-[11px] font-medium text-zinc-500">{label}</label>
 <div className="relative">
 <select id={id} value={value} onChange={e => onChange(e.target.value)}
  className="w-full appearance-none rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500/50 min-h-[44px] sm:min-h-0">
 {placeholder && <option value="" className="dark:text-zinc-700">{placeholder}</option>}
 {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
 </select>
 <ChevronDownIcon size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
 </div>
 {hint && <div className="mt-1 text-[10px] text-zinc-500">{hint}</div>}
 </div>
 )
}
