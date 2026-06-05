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
      <div className="list-editor">
        {stats.map((s, i) => (
          <div key={i} className="list-editor-item">
            <input value={s.key} onChange={e => update(i, 'key', e.target.value)} placeholder={keyPlaceholder} className="input" style={{ flex: 1 }} />
            <input value={s.value} onChange={e => update(i, 'value', e.target.value)} placeholder={valuePlaceholder} className="input" style={{ flex: 1 }} />
            <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(i)}><XIcon size={16} /></button>
          </div>
        ))}
      </div>
      <button className="list-editor-add" onClick={add}>
        <PlusIcon size={14} /> Add Stat
      </button>
    </div>
  )
}
