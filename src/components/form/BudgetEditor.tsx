import { PlusIcon, XIcon } from '../Icons'

interface BudgetEditorProps {
  budget: { item: string; amount: string }[]
  onChange: (budget: { item: string; amount: string }[]) => void
}

export function BudgetEditor({ budget, onChange }: BudgetEditorProps) {
  function update(i: number, field: 'item' | 'amount', val: string) {
    onChange(budget.map((b, idx) => idx === i ? { ...b, [field]: val } : b))
  }
  function remove(i: number) {
    onChange(budget.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...budget, { item: '', amount: '' }])
  }

  return (
    <div>
      <div className="space-y-2">
        {budget.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={b.item} onChange={e => update(i, 'item', e.target.value)} placeholder="Item"
              className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
            <input value={b.amount} onChange={e => update(i, 'amount', e.target.value)} placeholder="Amount"
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
        <PlusIcon size={14} /> Add Budget Item
      </button>
    </div>
  )
}
