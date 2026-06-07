interface ToggleProps {
 label: string
 checked: boolean
 onChange: (checked: boolean) => void
 hint?: string
 onLabel?: string
 offLabel?: string
}

export function Toggle(props: ToggleProps) {
 const { label, checked, onChange, hint, onLabel, offLabel } = props
 return (
 <label className="flex cursor-pointer items-center gap-3">
 <div className="relative">
 <input type="checkbox" className="peer sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
 <div className="h-5 w-9 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-zinc-500 after:transition-all peer-checked:border-emerald-500/50 peer-checked:bg-emerald-100 dark:bg-emerald-500/10 peer-checked:after:translate-x-4 peer-checked:after:bg-emerald-400" />
 </div>
 <div className="flex flex-1 flex-col">
 <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
 <span className="text-[10px] text-zinc-500">{checked ? (onLabel || 'Visible on site') : (offLabel || 'Hidden')}</span>
 </div>
 </label>
 )
}
