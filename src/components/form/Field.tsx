import { useState } from 'react'
import { AlertCircleIcon } from '../Icons'

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
    <div className={className || ''}>
      <label htmlFor={id} className="mb-1.5 flex items-center justify-between">
        <span className="block text-[11px] font-medium text-zinc-500">{label}</span>
        {maxLength && (
          <span className={`text-[11px] ${value.length > maxLength * 0.9 ? 'text-red-400' : 'text-zinc-600'}`}>
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
        className={`w-full rounded-lg border bg-zinc-900/50 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-emerald-500/50 ${error ? 'border-red-400' : 'border-zinc-800'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter() }}
      />
      {hint && !error && <div className="mt-1 text-[10px] text-zinc-500">{hint}</div>}
      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-400">
          <AlertCircleIcon size={12} /> {error}
        </div>
      )}
    </div>
  )
}
