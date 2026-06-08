import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase

export function storageUrl(path: string): string {
  if (!path || path.startsWith('http')) return path
  const p = path.startsWith('/') ? path.slice(1) : path
  return `${supabaseUrl}/storage/v1/object/public/ruclub/static/assets/${p}`
}

// Missions

export async function fetchMissions() {
  const { data } = await supabase.from('missions').select('*').order('date', { ascending: false })
  return data || []
}

export async function fetchMissionDetail(id: string) {
  const { data: mission } = await supabase.from('missions').select('*').eq('id', id).single()
  if (!mission) return null

  const [stats, partners, images, goals, timeline, participants, budget] = await Promise.all([
    supabase.from('mission_stats').select('*').eq('mission_id', id).order('sort_order'),
    supabase.from('mission_partners').select('name').eq('mission_id', id).order('sort_order'),
    supabase.from('mission_images').select('url, alt').eq('mission_id', id).order('sort_order'),
    supabase.from('mission_goals').select('goal').eq('mission_id', id).order('sort_order'),
    supabase.from('mission_timeline').select('title, date, description').eq('mission_id', id).order('sort_order'),
    supabase.from('mission_participants').select('group_name, participant_count').eq('mission_id', id).order('sort_order'),
    supabase.from('mission_budget').select('item, amount').eq('mission_id', id).order('sort_order'),
  ])

  return {
    ...mission,
    stats: (stats.data || []).map((s: { label: string; value: string }) => ({ label: s.label, value: s.value })),
    partners: (partners.data || []).map((p: { name: string }) => p.name),
    images: (images.data || []).map((i: { url: string; alt: string }) => ({
      url: storageUrl(`mission/${mission.slug}/${i.url}`),
      alt: i.alt,
    })),
    goals: (goals.data || []).map((g: { goal: string }) => g.goal),
    timeline: (timeline.data || []).map((t: { title: string; date?: string; description?: string }) => t),
    participants: (participants.data || []).map((p: { group_name: string; participant_count: string }) => ({ group_name: p.group_name, participant_count: p.participant_count })),
    budget: (budget.data || []).map((b: { item: string; amount?: string }) => b),
  }
}

export async function saveMission(id: string, payload: Record<string, unknown>) {
  const { stats, partners, images, goals, timeline, participants, budget, ...missionFields } = payload

  const { error } = await supabase.from('missions').upsert({ id, ...missionFields })
  if (error) return { error }

  if (stats !== undefined) {
    await supabase.from('mission_stats').delete().eq('mission_id', id)
    if (Array.isArray(stats) && stats.length > 0) {
      await supabase.from('mission_stats').insert(
        (stats as { label: string; value: string }[]).map((s, i) => ({ mission_id: id, label: s.label, value: s.value, sort_order: i }))
      )
    }
  }

  if (partners !== undefined) {
    await supabase.from('mission_partners').delete().eq('mission_id', id)
    if (Array.isArray(partners) && partners.length > 0) {
      await supabase.from('mission_partners').insert(
        (partners as string[]).map((name, i) => ({ mission_id: id, name, sort_order: i }))
      )
    }
  }

  if (images !== undefined) {
    await supabase.from('mission_images').delete().eq('mission_id', id)
    if (Array.isArray(images) && images.length > 0) {
      await supabase.from('mission_images').insert(
        (images as string[]).map((url, i) => ({
          mission_id: id,
          url: url.split('/').pop() || `img-${String(i + 1).padStart(2, '0')}.jpg`,
          alt: '',
          sort_order: i,
        }))
      )
    }
  }

  if (goals !== undefined) {
    await supabase.from('mission_goals').delete().eq('mission_id', id)
    if (Array.isArray(goals) && goals.length > 0) {
      await supabase.from('mission_goals').insert(
        (goals as string[]).map((g, i) => ({ mission_id: id, goal: g, sort_order: i }))
      )
    }
  }

  if (timeline !== undefined) {
    await supabase.from('mission_timeline').delete().eq('mission_id', id)
    if (Array.isArray(timeline) && timeline.length > 0) {
      await supabase.from('mission_timeline').insert(
        (timeline as { title: string; date?: string; description?: string }[]).map((t, i) => ({
          mission_id: id, title: t.title, date: t.date, description: t.description, sort_order: i,
        }))
      )
    }
  }

  if (participants !== undefined) {
    await supabase.from('mission_participants').delete().eq('mission_id', id)
    if (Array.isArray(participants) && participants.length > 0) {
      await supabase.from('mission_participants').insert(
        (participants as { group_name: string; participant_count: string }[]).map((p, i) => ({
          mission_id: id, group_name: p.group_name, participant_count: p.participant_count, sort_order: i,
        }))
      )
    }
  }

  if (budget !== undefined) {
    await supabase.from('mission_budget').delete().eq('mission_id', id)
    if (Array.isArray(budget) && budget.length > 0) {
      await supabase.from('mission_budget').insert(
        (budget as { item: string; amount?: string }[]).map((b, i) => ({
          mission_id: id, item: b.item, amount: b.amount || null, sort_order: i,
        }))
      )
    }
  }

  return { error: null }
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
  const { error } = await supabase.from('announcements').upsert({ id, ...payload })
  return { error }
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  return { error }
}

// Members

export async function fetchMembers() {
  const { data } = await supabase.from('members').select('*').order('sort_order')
  if (!data) return null
  const teachers = data.filter((m: { group_name: string }) => m.group_name === 'teachers')
  const core = data.filter((m: { group_name: string }) => m.group_name === 'core')
  const general = data.filter((m: { group_name: string }) => m.group_name === 'general')
  return {
    teachers,
    core,
    general,
    stats: {
      teachers: teachers.length,
      core: core.length,
      general: general.length,
      total: data.length,
    },
  }
}

export async function saveMembers(payload: Record<string, unknown>) {
  const { teachers, core, general, stats, ...rest } = payload as Record<string, unknown> & { teachers: { name: string; class?: string; role: string; memberType?: string; groupName?: string; id?: number }[]; core: { name: string; class?: string; role: string; memberType?: string; groupName?: string; id?: number }[]; general: { name: string; class?: string; role: string; memberType?: string; groupName?: string; id?: number }[] }

  const { error: delErr } = await supabase.from('members').delete().neq('id', 0)
  if (delErr) return { error: delErr }

  const allMembers = [
    ...teachers.map((m, i) => ({
      name: m.name, class: m.class || null, role: m.role,
      member_type: m.memberType || 'patron', group_name: 'teachers', sort_order: i,
    })),
    ...core.map((m, i) => ({
      name: m.name, class: m.class || null, role: m.role,
      member_type: m.memberType || 'coord', group_name: 'core', sort_order: i,
    })),
    ...general.map((m, i) => ({
      name: m.name, class: m.class || null, role: m.role,
      member_type: m.memberType || 'member', group_name: 'general', sort_order: i,
    })),
  ].filter(m => m.name.trim())

  if (allMembers.length > 0) {
    const { error } = await supabase.from('members').insert(allMembers)
    return { error }
  }
  return { error: null }
}

// Hero Content

export async function fetchHeroContent() {
  const { data } = await supabase.from('hero_content').select('*').single()
  return data
}

export async function saveHeroContent(payload: Record<string, unknown>) {
  const { error } = await supabase.from('hero_content').upsert({ id: 1, ...payload })
  return { error }
}

// Intro Content

export async function fetchIntroContent() {
  const [contentRes, paragraphsRes] = await Promise.all([
    supabase.from('intro_content').select('*').single(),
    supabase.from('intro_paragraphs').select('*').order('sort_order'),
  ])
  return {
    ...(contentRes.data || {}),
    paragraphs: (paragraphsRes.data || []).map((p: { content: string }) => p.content),
  }
}

export async function saveIntroContent(payload: Record<string, unknown>) {
  const { paragraphs, ...contentFields } = payload
  const { error } = await supabase.from('intro_content').upsert({ id: 1, ...contentFields })
  if (error) return { error }

  if (paragraphs !== undefined) {
    await supabase.from('intro_paragraphs').delete().eq('intro_id', 1)
    if (Array.isArray(paragraphs) && paragraphs.length > 0) {
      await supabase.from('intro_paragraphs').insert(
        (paragraphs as string[]).map((p, i) => ({ intro_id: 1, content: p, sort_order: i }))
      )
    }
  }
  return { error: null }
}

// Feature Cards

export async function fetchFeatureCards() {
  const { data } = await supabase.from('feature_cards').select('*').order('sort_order')
  return data || []
}

export async function saveFeatureCards(items: { title: string; description: string; icon: string; sort_order: number }[]) {
  const { error: delErr } = await supabase.from('feature_cards').delete().neq('id', 0)
  if (delErr) return { error: delErr }
  const { error } = await supabase.from('feature_cards').insert(items)
  return { error }
}

// CTA Content

export async function fetchCTAContent() {
  const { data } = await supabase.from('cta_content').select('*').single()
  return data
}

export async function saveCTAContent(payload: Record<string, unknown>) {
  const { error } = await supabase.from('cta_content').upsert({ id: 1, ...payload })
  return { error }
}

// Mission Section

export async function fetchMissionSectionContent() {
  const { data } = await supabase.from('mission_section').select('*').single()
  return data
}

export async function saveMissionSectionContent(payload: Record<string, unknown>) {
  const { error } = await supabase.from('mission_section').upsert({ id: 1, ...payload })
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

// Images — upload to Supabase Storage (ruclub bucket, static/assets/ prefix)

const STORAGE_BUCKET = 'ruclub'
const STORAGE_PREFIX = 'static/assets/'

export async function uploadImage(bucket: string, path: string, file: File) {
  const storagePath = path.startsWith(STORAGE_PREFIX) ? path : `${STORAGE_PREFIX}${path}`
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file, { upsert: true })
  if (error) return { error }
  const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
  return { url: publicUrl }
}

export async function uploadBase64Image(bucket: string, path: string, dataUrl: string) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const file = new File([blob], path.split('/').pop() || 'image', { type: blob.type })
  return uploadImage(bucket, path, file)
}

export { supabase as default }
