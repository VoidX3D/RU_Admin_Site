import { PlusIcon, XIcon } from '../Icons'

interface PartnersEditorProps {
 partners: string[]
 onChange: (partners: string[]) => void
}

export function PartnersEditor(props: PartnersEditorProps) {
 const { partners, onChange } = props

 function update(i: number, val: string) {
 onChange(partners.map((p, idx) => idx === i ? val : p))
 }

 function remove(i: number) {
 onChange(partners.filter((_, idx) => idx !== i))
 }

 function add() {
 onChange([...partners, ''])
 }

 return (
 <div>
 <div className="space-y-2">
 {partners.map((p, i) => (
 <div key={i} className="flex items-center gap-2">
 <input value={p} onChange={e => update(i, e.target.value)} placeholder="Partner name"
 className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-zinc-700 dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
 <button onClick={() => remove(i)}
 className="rounded border dark:border-zinc-800 dark:bg-zinc-900/50 p-1.5 text-zinc-500 hover:border-red-400/50 hover:text-red-600 dark:text-red-400">
 <XIcon size={14} />
 </button>
 </div>
 ))}
 </div>
 <button onClick={add}
 className="mt-3 flex items-center gap-1.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-900/50 px-3 py-1.5 text-xs dark:text-zinc-400 hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-white">
 <PlusIcon size={14} /> Add Partner
 </button>
 </div>
 )
}
