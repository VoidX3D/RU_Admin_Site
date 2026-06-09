import type { MissionTimeline } from '../../types'
import { PlusIcon, XIcon } from '../Icons'

interface TimelineEditorProps {
  timeline: MissionTimeline[]
  onChange: (timeline: MissionTimeline[]) => void
}

export function TimelineEditor({ timeline, onChange }: TimelineEditorProps) {
  function update(i: number, field: keyof MissionTimeline, val: string) {
    onChange(timeline.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }
  function remove(i: number) {
    onChange(timeline.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...timeline, { title: '', date: '', description: '' }])
  }

  return (
    <div>
      <div className="space-y-3">
        {timeline.map((t, i) => (
          <div key={i} className="rounded-lg border dark:border-zinc-800/50 dark:bg-zinc-900/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Event {i + 1}</span>
              <button onClick={() => remove(i)}
                className="rounded p-1 text-zinc-500 hover:border-red-400/50 hover:text-red-600">
                <XIcon size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={t.title} onChange={e => update(i, 'title', e.target.value)} placeholder="Title"
                className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
              <input value={t.date || ''} onChange={e => update(i, 'date', e.target.value)} placeholder="Date"
                className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
              <div className="sm:col-span-2">
                <textarea value={t.description || ''} onChange={e => update(i, 'description', e.target.value)} placeholder="Description"
                  rows={2}
                  className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add}
        className="mt-3 flex items-center gap-1.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-900/50 px-3 py-1.5 text-xs dark:text-zinc-400 hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-white">
        <PlusIcon size={14} /> Add Event
      </button>
    </div>
  )
}
