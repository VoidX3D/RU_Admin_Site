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
  if (RULES_CACHE.has(key)) return RULES_CACHE.get(key)!
  const compiled: ValidationRule[] = []
  if (rules.required) {
    compiled.push({ validate: v => v.trim().length > 0, message: rules.required })
  }
  if (rules.minLength) {
    compiled.push({ validate: v => v.length >= rules.minLength!.value, message: rules.minLength.message })
  }
  if (rules.maxLength) {
    compiled.push({ validate: v => v.length <= rules.maxLength!.value, message: rules.maxLength.message })
  }
  if (rules.pattern) {
    compiled.push({ validate: v => rules.pattern!.regex.test(v), message: rules.pattern.message })
  }
  if (rules.custom) compiled.push(...rules.custom)
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
