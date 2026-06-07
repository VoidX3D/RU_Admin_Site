export interface ValidationRule {
  validate: (value: string) => boolean
  message: string
}

export interface FieldRules {
  required?: string
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  pattern?: { regex: RegExp; message: string }
  custom?: ValidationRule[]
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

const RULES_CACHE = new Map<string, ValidationRule[]>()

function compileRules(rules: FieldRules): ValidationRule[] {
  const key = JSON.stringify(rules)
  const cached = RULES_CACHE.get(key)
  if (cached) return cached
  const compiled: ValidationRule[] = []
  if (rules.required) {
    compiled.push({ validate: v => v.trim().length > 0, message: rules.required })
  }
  if (rules.minLength) {
    const { value, message } = rules.minLength
    compiled.push({ validate: v => v.length >= value, message })
  }
  if (rules.maxLength) {
    const { value, message } = rules.maxLength
    compiled.push({ validate: v => v.length <= value, message })
  }
  if (rules.pattern) {
    const { regex, message } = rules.pattern
    compiled.push({ validate: v => regex.test(v), message })
  }
  if (rules.custom) compiled.push(...rules.custom)
  if (RULES_CACHE.size > 100) RULES_CACHE.clear()
  RULES_CACHE.set(key, compiled)
  return compiled
}

export function validateField(value: string, rules: FieldRules): string | null {
  const compiled = compileRules(rules)
  for (const rule of compiled) {
    if (!rule.validate(value)) return rule.message
  }
  return null
}

export function validateForm(
  data: Record<string, string>,
  schema: Record<string, FieldRules>
): ValidationResult {
  const errors: Record<string, string> = {}
  let valid = true
  for (const [field, rules] of Object.entries(schema)) {
    const err = validateField(data[field] || '', rules)
    if (err) { errors[field] = err; valid = false }
  }
  return { valid, errors }
}

export function isFormDirty(original: Record<string, unknown>, current: Record<string, unknown>): boolean {
  for (const key of Object.keys(current)) {
    if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) return true
  }
  return false
}

export function getChangedFields<T extends Record<string, unknown>>(original: T, current: T): Partial<T> {
  const changed: Partial<T> = {}
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
      changed[key] = current[key]
    }
  }
  return changed
}
