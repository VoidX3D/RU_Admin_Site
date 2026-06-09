import { PlusIcon, XIcon } from '../Icons'

interface GoalsEditorProps {
  goals: string[]
  onChange: (goals: string[]) => void
}

export function GoalsEditor({ goals, onChange }: GoalsEditorProps) {
  function update(i: number, val: string) {
    onChange(goals.map((g, idx) => idx === i ? val : g))
  }
  function remove(i: number) {
    onChange(goals.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...goals, ''])
  }

  return (
    <div>
      <div className="space-y-2">
        {goals.map((g, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">{i + 1}</span>
            <input value={g} onChange={e => update(i, e.target.value)} placeholder="Enter a goal..."
              className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
            <button onClick={() => remove(i)}
              className="rounded border dark:border-zinc-800 dark:bg-zinc-900/50 p-1.5 text-zinc-500 hover:border-red-400/50 hover:text-red-600">
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add}
        className="mt-3 flex items-center gap-1.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-900/50 px-3 py-1.5 text-xs dark:text-zinc-400 hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-white">
        <PlusIcon size={14} /> Add Goal
      </button>
    </div>
  )
}
