export interface ValidationRule {
  validate: (value: string) => boolean
  message: string
}

export interface FieldRules {
  required?: string
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  pattern?: { regex: RegExp; message: string }
  email?: string
  slug?: string
  date?: string
  imageType?: string
  custom?: ValidationRule[]
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const ALLOWED_IMAGE_TYPES = /\.(jpg|jpeg|png|webp)$/i

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
  if (rules.email) {
    compiled.push({ validate: v => !v || EMAIL_REGEX.test(v), message: rules.email })
  }
  if (rules.slug) {
    compiled.push({ validate: v => !v || SLUG_REGEX.test(v), message: rules.slug })
  }
  if (rules.date) {
    compiled.push({ validate: v => !v || DATE_REGEX.test(v), message: rules.date })
  }
  if (rules.imageType) {
    compiled.push({ validate: v => !v || ALLOWED_IMAGE_TYPES.test(v), message: rules.imageType })
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

export function validateEmail(email: string): string | null {
  if (!email) return null
  return EMAIL_REGEX.test(email) ? null : 'Invalid email format'
}

export function validateSlug(slug: string): string | null {
  if (!slug) return null
  return SLUG_REGEX.test(slug) ? null : 'Slug must be lowercase with hyphens (e.g. my-mission)'
}

export function validateDate(date: string): string | null {
  if (!date) return null
  if (DATE_REGEX.test(date)) return null
  if (/^[A-Z][a-z]+ \d{4}$/.test(date)) return null
  if (/^[A-Z][a-z]+ \d{1,2},? \d{4}$/.test(date)) return null
  return 'Use format: YYYY-MM-DD or "January 2025"'
}

export function validateImageFile(filename: string): string | null {
  if (!filename) return null
  return ALLOWED_IMAGE_TYPES.test(filename) ? null : 'Only JPG, PNG, WebP allowed'
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

export async function checkSlugUnique(slug: string, currentId: string, existingSlugs: string[]): Promise<string | null> {
  if (!slug.trim()) return 'Slug is required'
  if (!SLUG_REGEX.test(slug)) return 'Slug must be lowercase with hyphens'
  const duplicate = existingSlugs.find(s => s === slug && s !== currentId)
  return duplicate ? 'This slug is already in use' : null
}
