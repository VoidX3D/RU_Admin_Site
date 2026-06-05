import type { Draft } from '../types'
import { Storage } from './storage'

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || singular + 's')
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function timeAgo(date: Date | string | number): string {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

export function countDrafts(): Record<string, number> {
  const drafts = Storage.listDrafts()
  return {
    total: drafts.length,
    missions: drafts.filter(d => d.type === 'mission').length,
    announcements: drafts.filter(d => d.type === 'announcement').length,
    members: drafts.filter(d => d.type === 'members').length,
  }
}

export function getDraftSummary(draft: Draft): string {
  const parts: string[] = []
  if (draft.type === 'mission') {
    parts.push(`${draft.imageCount || 0} image(s)`)
    if (draft.stats && Array.isArray(draft.stats)) parts.push(`${draft.stats.length} stat(s)`)
    if (draft.partners && Array.isArray(draft.partners)) parts.push(`${draft.partners.length} partner(s)`)
  }
  if (draft.type === 'announcement') {
    if (draft.image) parts.push('1 image')
  }
  return parts.length ? parts.join(', ') : 'No additional data'
}
