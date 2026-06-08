import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase

// Missions

export async function fetchMissions() {
  const { data } = await supabase.from('missions').select('*').order('date', { ascending: false })
  return data || []
}

export async function fetchMissionDetail(id: string) {
  const { data } = await supabase.from('missions').select('*').eq('id', id).single()
  return data
}

export async function saveMission(id: string, payload: Record<string, unknown>) {
  const { error } = await supabase.from('missions').upsert({ id, ...payload, updated_at: new Date().toISOString() })
  return { error }
}

export async function deleteMission(id: string) {
  const { error } = await supabase.from('missions').delete().eq('id', id)
  return { error }
}

// Announcements

export async function fetchAnnouncements() {
  const { data } = await supabase.from('announcements').select('*').order('date', { ascending: false })
  return data || []
}

export async function fetchAnnouncementDetail(id: string) {
  const { data } = await supabase.from('announcements').select('*').eq('id', id).single()
  return data
}

export async function saveAnnouncement(id: string, payload: Record<string, unknown>) {
  const { error } = await supabase.from('announcements').upsert({ id, ...payload, updated_at: new Date().toISOString() })
  return { error }
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  return { error }
}

// Members

export async function fetchMembers() {
  const { data } = await supabase.from('members').select('*').single()
  return data
}

export async function saveMembers(payload: Record<string, unknown>) {
  const { error } = await supabase.from('members').upsert({ id: 1, ...payload, updated_at: new Date().toISOString() })
  return { error }
}

// Site Config

export async function fetchSiteConfig() {
  const { data } = await supabase.from('site_config').select('*').single()
  return data
}

export async function saveSiteConfig(payload: Record<string, unknown>) {
  const { error } = await supabase.from('site_config').upsert({ id: 1, ...payload, updated_at: new Date().toISOString() })
  return { error }
}

// Content

export async function fetchContent() {
  const { data } = await supabase.from('content').select('*').single()
  return data
}

export async function saveContent(payload: Record<string, unknown>) {
  const { error } = await supabase.from('content').upsert({ id: 1, ...payload, updated_at: new Date().toISOString() })
  return { error }
}

// Stats & Partners

export async function fetchStats() {
  const { data } = await supabase.from('stats').select('*').order('sort_order')
  return data || []
}

export async function saveStats(items: { value: string; label: string; sort_order: number }[]) {
  const { error: delErr } = await supabase.from('stats').delete().neq('id', 0)
  if (delErr) return { error: delErr }
  const { error } = await supabase.from('stats').insert(items)
  return { error }
}

export async function fetchPartners() {
  const { data } = await supabase.from('partners').select('*').order('sort_order')
  return data || []
}

export async function savePartners(items: { src: string; alt: string; name: string; sort_order: number }[]) {
  const { error: delErr } = await supabase.from('partners').delete().neq('id', 0)
  if (delErr) return { error: delErr }
  const { error } = await supabase.from('partners').insert(items)
  return { error }
}

// Images — upload to Supabase Storage

export async function uploadImage(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) return { error }
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: publicUrl }
}

export async function uploadBase64Image(bucket: string, path: string, dataUrl: string) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const file = new File([blob], path.split('/').pop() || 'image', { type: blob.type })
  return uploadImage(bucket, path, file)
}

export { supabase as default }
