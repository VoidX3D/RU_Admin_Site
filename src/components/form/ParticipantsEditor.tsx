import { PlusIcon, XIcon } from '../Icons'

interface ParticipantsEditorProps {
  participants: { group_name: string; participant_count: string }[]
  onChange: (participants: { group_name: string; participant_count: string }[]) => void
}

export function ParticipantsEditor({ participants, onChange }: ParticipantsEditorProps) {
  function update(i: number, field: 'group_name' | 'participant_count', val: string) {
    onChange(participants.map((p, idx) => idx === i ? { ...p, [field]: val } : p))
  }
  function remove(i: number) {
    onChange(participants.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...participants, { group_name: '', participant_count: '' }])
  }

  return (
    <div>
      <div className="space-y-2">
        {participants.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={p.group_name} onChange={e => update(i, 'group_name', e.target.value)} placeholder="Group name"
              className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
            <input value={p.participant_count} onChange={e => update(i, 'participant_count', e.target.value)} placeholder="Count"
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
        <PlusIcon size={14} /> Add Participant Group
      </button>
    </div>
  )
}
