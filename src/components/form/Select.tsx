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
    <div className="form-row">
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)} className="input">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <div className="form-row-hint">{hint}</div>}
    </div>
  )
}
