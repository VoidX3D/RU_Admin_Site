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
    <div className={`toggle-card${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
      <div className="toggle-switch" />
      <div style={{ flex: 1 }}>
        <div className="toggle-label">{label}</div>
        <div className="toggle-hint">{checked ? (onLabel || 'Visible on site') : (offLabel || 'Hidden')}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
    </div>
  )
}
