import { createClient } from '@supabase/supabase-js'
import { Storage } from './storage'
import { useStore } from '../store'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const hasSupabase = supabaseUrl && supabaseAnonKey

export const supabaseAnon = hasSupabase
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { storageKey: 'sb-ruclub-admin-anon' } })
  : (null as unknown as ReturnType<typeof createClient>)

let _unauthorizedHandled = false

function handleUnauthorized() {
  if (_unauthorizedHandled) return
  _unauthorizedHandled = true
  Storage.clearSession()
  useStore.getState().setView('login')
  useStore.getState().addToast('Session expired. Please log in again.', 'warning')
  setTimeout(() => { _unauthorizedHandled = false }, 5000)
}

const REQUEST_TIMEOUT = 20000

async function api(action: string, params?: Record<string, unknown>): Promise<any> {
  const token = Storage.getToken()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token, ...params }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      if (res.status === 401) {
        handleUnauthorized()
        return { data: null, _expired: true }
      }
      throw new Error(`Request failed (${res.status})`)
    }
    return res.json()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    if (e instanceof TypeError && e.message === 'Failed to fetch') {
      throw new Error('Network error — check your connection')
    }
    throw e
  }
}

export async function login(username: string, password: string) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { error: body.error || `Login failed (${res.status})` }
    }
    return res.json()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { error: 'Request timed out' }
    }
    return { error: 'Network error — check your connection' }
  }
}

export function storageUrl(path: string): string {
  if (!path || path.startsWith('http')) return path
  const p = path.startsWith('/') ? path.slice(1) : path
  return `${supabaseUrl}/storage/v1/object/public/ruclub/static/assets/${p}`
}

export async function uploadBase64Image(_bucket: string, path: string, dataUrl: string) {
  const result = await api('image:upload', { bucket: _bucket, path, dataUrl })
  return result
}

export async function uploadImage(_bucket: string, path: string, file: File) {
  return new Promise<{ url?: string; error?: any }>((resolve) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const result = await api('image:upload', { bucket: _bucket, path, dataUrl })
      resolve(result)
    }
    reader.onerror = () => resolve({ error: 'Failed to read file' })
    reader.readAsDataURL(file)
  })
}

// Missions
export async function fetchMissions() {
  const result = await api('missions:list')
  return result.data || []
}

export async function fetchMissionDetail(id: string) {
  const result = await api('missions:detail', { id })
  return result.data || null
}

export async function saveMission(id: string, payload: Record<string, unknown>) {
  const result = await api('missions:save', { id, fields: payload })
  return result
}

export async function deleteMission(id: string) {
  const result = await api('missions:delete', { id })
  return result
}

// Announcements
export async function fetchAnnouncements() {
  const result = await api('announcements:list')
  return result.data || []
}

export async function fetchAnnouncementDetail(id: string) {
  const result = await api('announcements:detail', { id })
  return result.data || null
}

export async function saveAnnouncement(id: string, payload: Record<string, unknown>) {
  const result = await api('announcements:save', { id, fields: payload })
  return result
}

export async function deleteAnnouncement(id: string) {
  const result = await api('announcements:delete', { id })
  return result
}

// Members
export async function fetchMembers() {
  const result = await api('members:list')
  return result.data || null
}

export async function saveMembers(payload: Record<string, unknown>) {
  const result = await api('members:save', { payload })
  return result
}

// Stats & Partners
export async function fetchStats() {
  const result = await api('stats:list')
  return result.data || []
}

export async function saveStats(items: { value: string; label: string; sort_order: number }[]) {
  const result = await api('stats:save', { items })
  return result
}

export async function fetchPartners() {
  const result = await api('partners:list')
  return result.data || []
}

export async function savePartners(items: { src: string; alt: string; name: string; sort_order: number }[]) {
  const result = await api('partners:save', { items })
  return result
}

// Contact Submissions
export async function fetchContactSubmissions() {
  const result = await api('contact:list')
  return result.data || []
}

export async function deleteContactSubmission(id: number) {
  const result = await api('contact:delete', { id })
  return result
}

// DB health check
export async function checkDBConnection() {
  const result = await api('db:check')
  return result.connected === true
}
