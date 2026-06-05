import { useState } from 'react'

interface TextareaProps {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  hint?: string
  error?: string | null
  rows?: number
  minRows?: number
  maxLength?: number
  className?: string
  monospace?: boolean
}

export function Textarea(props: TextareaProps) {
  const { label, value, onChange, placeholder, hint, error, rows = 4, maxLength, className, monospace } = props
  const id = `ta-${label.toLowerCase().replace(/\s+/g, '-')}`

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
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`input${error ? ' error' : ''}`}
        style={{ resize: 'vertical', minHeight: rows * 24 + 24, fontFamily: monospace ? 'monospace' : 'inherit' }}
      />
      {hint && !error && <div className="form-row-hint">{hint}</div>}
      {error && <div className="form-row-error">⚠ {error}</div>}
    </div>
  )
}
