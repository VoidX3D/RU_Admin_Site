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
    participants: (participants.data || []).map((p: { group_name: string; participant_count: string }) => p),
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
  const tables = ['mission_stats', 'mission_partners', 'mission_images', 'mission_goals', 'mission_timeline', 'mission_participants', 'mission_budget']
  for (const table of tables) {
    await supabase.from(table as never).delete().eq('mission_id', id)
  }
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
  if (!data) return null

  const [tagsRes, galleryRes] = await Promise.all([
    supabase.from('announcement_tags').select('tag').eq('announcement_id', id).order('sort_order'),
    supabase.from('announcement_gallery').select('url, alt').eq('announcement_id', id).order('sort_order'),
  ])

  return {
    ...data,
    tags: (tagsRes.data || []).map((t: { tag: string }) => t.tag),
    gallery: (galleryRes.data || []).map((g: { url: string; alt: string }) => ({
      url: storageUrl(`announcements/${g.url}`),
      alt: g.alt,
    })),
  }
}

export async function saveAnnouncement(id: string, payload: Record<string, unknown>) {
  const { tags, gallery, ...fields } = payload

  const { error } = await supabase.from('announcements').upsert({ id, ...fields })
  if (error) return { error }

  if (tags !== undefined) {
    await supabase.from('announcement_tags').delete().eq('announcement_id', id)
    if (Array.isArray(tags) && tags.length > 0) {
      await supabase.from('announcement_tags').insert(
        (tags as string[]).map((tag, i) => ({ announcement_id: id, tag, sort_order: i }))
      )
    }
  }

  if (gallery !== undefined) {
    await supabase.from('announcement_gallery').delete().eq('announcement_id', id)
    if (Array.isArray(gallery) && gallery.length > 0) {
      await supabase.from('announcement_gallery').insert(
        (gallery as string[]).map((url, i) => ({
          announcement_id: id, url: url.split('/').pop() || `img-${i}.jpg`, alt: '', sort_order: i,
        }))
      )
    }
  }

  return { error: null }
}

export async function deleteAnnouncement(id: string) {
  await supabase.from('announcement_tags').delete().eq('announcement_id', id)
  await supabase.from('announcement_gallery').delete().eq('announcement_id', id)
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  return { error }
}

// Members

export async function fetchMembers() {
  const { data } = await supabase.from('members').select('*').order('sort_order')
  if (!data) return null
  return {
    teachers: data.filter((m: { group_name: string }) => m.group_name === 'teachers'),
    core: data.filter((m: { group_name: string }) => m.group_name === 'core'),
    general: data.filter((m: { group_name: string }) => m.group_name === 'general'),
    stats: {
      teachers: data.filter((m: { group_name: string }) => m.group_name === 'teachers').length,
      core: data.filter((m: { group_name: string }) => m.group_name === 'core').length,
      general: data.filter((m: { group_name: string }) => m.group_name === 'general').length,
      total: data.length,
    },
  }
}

export async function saveMembers(payload: Record<string, unknown>) {
  const { teachers, core, general } = payload as Record<string, unknown> & {
    teachers: { name: string; class?: string; role: string; image?: string; member_type?: string }[]
    core: { name: string; class?: string; role: string; image?: string; member_type?: string }[]
    general: { name: string; class?: string; role: string; image?: string; member_type?: string }[]
  }

  const { error: delErr } = await supabase.from('members').delete().neq('id', 0)
  if (delErr) return { error: delErr }

  const allMembers = [
    ...teachers.map((m, i) => ({
      name: m.name, class: m.class || null, role: m.role, image: m.image || null,
      member_type: m.member_type || 'patron', group_name: 'teachers', sort_order: i,
    })),
    ...core.map((m, i) => ({
      name: m.name, class: m.class || null, role: m.role, image: m.image || null,
      member_type: m.member_type || 'coord', group_name: 'core', sort_order: i,
    })),
    ...general.map((m, i) => ({
      name: m.name, class: m.class || null, role: m.role, image: m.image || null,
      member_type: m.member_type || 'member', group_name: 'general', sort_order: i,
    })),
  ].filter(m => m.name.trim())

  if (allMembers.length > 0) {
    const { error } = await supabase.from('members').insert(allMembers)
    return { error }
  }
  return { error: null }
}

// Stats & Partners (global)

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
  if (!data) return []
  return data.map((p: { src: string; alt: string; name: string; sort_order: number; id?: number }) => ({
    ...p,
    src: storageUrl(p.src),
  }))
}

export async function savePartners(items: { src: string; alt: string; name: string; sort_order: number }[]) {
  const { error: delErr } = await supabase.from('partners').delete().neq('id', 0)
  if (delErr) return { error: delErr }
  const { error } = await supabase.from('partners').insert(items)
  return { error }
}

// Contact Submissions

export async function fetchContactSubmissions() {
  const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function deleteContactSubmission(id: number) {
  const { error } = await supabase.from('contact_submissions').delete().eq('id', id)
  return { error }
}

// Images — upload to Supabase Storage

const STORAGE_BUCKET = 'ruclub'
const STORAGE_PREFIX = 'static/assets/'

export async function uploadImage(_bucket: string, path: string, file: File) {
  const storagePath = path.startsWith(STORAGE_PREFIX) ? path : `${STORAGE_PREFIX}${path}`
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file, { upsert: true })
  if (error) return { error }
  const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
  return { url: publicUrl }
}

export async function uploadBase64Image(_bucket: string, path: string, dataUrl: string) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const file = new File([blob], path.split('/').pop() || 'image', { type: blob.type })
  return uploadImage(_bucket, path, file)
}
