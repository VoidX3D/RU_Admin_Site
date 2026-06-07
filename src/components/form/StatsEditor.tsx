import type { StatRow } from '../../types'
import { PlusIcon, XIcon } from '../Icons'

interface StatsEditorProps {
  stats: StatRow[]
  onChange: (stats: StatRow[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function StatsEditor(props: StatsEditorProps) {
  const { stats, onChange, keyPlaceholder = 'Label', valuePlaceholder = 'Value' } = props

  function update(i: number, field: 'key' | 'value', val: string) {
    onChange(stats.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  function remove(i: number) {
    onChange(stats.filter((_, idx) => idx !== i))
  }

  function add() {
    onChange([...stats, { key: '', value: '' }])
  }

  return (
    <div>
      <div className="space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={s.key} onChange={e => update(i, 'key', e.target.value)} placeholder={keyPlaceholder}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-emerald-500/50" />
            <input value={s.value} onChange={e => update(i, 'value', e.target.value)} placeholder={valuePlaceholder}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-emerald-500/50" />
            <button onClick={() => remove(i)}
              className="rounded border border-zinc-800 bg-zinc-900/50 p-1.5 text-zinc-500 hover:border-red-400/50 hover:text-red-400">
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-white">
        <PlusIcon size={14} /> Add Stat
      </button>
    </div>
  )
}
