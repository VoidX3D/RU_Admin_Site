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
      <div className="list-editor">
        {partners.map((p, i) => (
          <div key={i} className="list-editor-item">
            <input value={p} onChange={e => update(i, e.target.value)} placeholder="Partner name" className="input" />
            <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(i)}><XIcon size={16} /></button>
          </div>
        ))}
      </div>
      <button className="list-editor-add" onClick={add}>
        <PlusIcon size={14} /> Add Partner
      </button>
    </div>
  )
}
