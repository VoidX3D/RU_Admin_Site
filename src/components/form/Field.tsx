import { useState } from 'react'

interface FieldProps {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  hint?: string
  error?: string | null
  disabled?: boolean
  readOnly?: boolean
  className?: string
  autoFocus?: boolean
  onEnter?: () => void
  maxLength?: number
  type?: string
}

export function Field(props: FieldProps) {
  const { label, value, onChange, placeholder, hint, error, disabled, readOnly, className, autoFocus, onEnter, maxLength, type } = props
  const [focused, setFocused] = useState(false)
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={`form-row ${className || ''}`}>
      <label htmlFor={id} className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        {maxLength && (
          <span style={{ fontSize: 11, color: value.length > maxLength * 0.9 ? 'var(--red)' : 'var(--text-tertiary)' }}>
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      <input
        id={id}
        type={type || 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        autoFocus={autoFocus}
        maxLength={maxLength}
        className={`input${error ? ' error' : ''}${focused ? ' focus' : ''}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter() }}
      />
      {hint && !error && <div className="form-row-hint">{hint}</div>}
      {error && <div className="form-row-error">⚠ {error}</div>}
    </div>
  )
}
