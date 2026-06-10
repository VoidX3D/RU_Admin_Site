import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || ''
const jwtSecret = process.env.JWT_SECRET || 'ru-admin-secret-change-in-production'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { storageKey: 'sb-ruclub-admin-service' },
})

function token(user: string) {
  return jwt.sign({ user, role: 'admin' }, jwtSecret, { expiresIn: '12h' })
}

function verify(tokenStr: string) {
  try { return jwt.verify(tokenStr, jwtSecret) as { user: string } }
  catch { return null }
}

const ADMIN_USER = process.env.ADMIN_USERNAME || process.env.VITE_ADMIN_USERNAME || ''
const ADMIN_PASS = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || ''
const MASTER_KEY = process.env.MASTER_KEY || process.env.VITE_MASTER_KEY || ''

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, token: tokenStr, ...params } = req.body

  if (action === 'login') {
    const { username, password } = params
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' })

    if (MASTER_KEY && password === MASTER_KEY) {
      return res.json({ token: token('master'), user: 'master' })
    }

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return res.json({ token: token(username), user: username })
    }

    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const session = verify(tokenStr || '')
  if (!session) return res.status(401).json({ error: 'Invalid or expired token' })

  try {
    const result = await handleAction(action, params)
    return res.json(result)
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || 'Internal error' } })
  }
}

async function handleAction(action: string, params: any) {
  switch (action) {
    // Missions
    case 'missions:list': {
      const { data } = await supabaseAdmin.from('missions').select('*').order('date', { ascending: false })
      return { data: data || [] }
    }
    case 'missions:detail': {
      const { id } = params
      const { data: mission } = await supabaseAdmin.from('missions').select('*').eq('id', id).single()
      if (!mission) return { data: null }
      const [stats, partners, images, goals, timeline, participants, budget] = await Promise.all([
        supabaseAdmin.from('mission_stats').select('*').eq('mission_id', id).order('sort_order'),
        supabaseAdmin.from('mission_partners').select('name').eq('mission_id', id).order('sort_order'),
        supabaseAdmin.from('mission_images').select('url, alt').eq('mission_id', id).order('sort_order'),
        supabaseAdmin.from('mission_goals').select('goal').eq('mission_id', id).order('sort_order'),
        supabaseAdmin.from('mission_timeline').select('title, date, description').eq('mission_id', id).order('sort_order'),
        supabaseAdmin.from('mission_participants').select('group_name, participant_count').eq('mission_id', id).order('sort_order'),
        supabaseAdmin.from('mission_budget').select('item, amount').eq('mission_id', id).order('sort_order'),
      ])
      return {
        data: {
          ...mission,
          stats: (stats.data || []).map((s: any) => ({ label: s.label, value: s.value })),
          partners: (partners.data || []).map((p: any) => p.name),
          images: (images.data || []).map((i: any) => ({
            url: storageUrl(`mission/${mission.slug}/${i.url}`),
            alt: i.alt,
          })),
          goals: (goals.data || []).map((g: any) => g.goal),
          timeline: (timeline.data || []).map((t: any) => ({ title: t.title, date: t.date, description: t.description })),
          participants: (participants.data || []).map((p: any) => ({ group_name: p.group_name, participant_count: p.participant_count })),
          budget: (budget.data || []).map((b: any) => ({ item: b.item, amount: b.amount })),
        },
      }
    }
    case 'missions:save': {
      const { id, fields } = params
      const { stats, partners, images, goals, timeline, participants, budget, ...missionFields } = fields
      const { error: e1 } = await supabaseAdmin.from('missions').upsert({ id, ...missionFields })
      if (e1) return { error: { message: e1.message } }
      if (stats !== undefined) {
        const { error: e } = await supabaseAdmin.from('mission_stats').delete().eq('mission_id', id)
        if (e) return { error: { message: e.message } }
        if (Array.isArray(stats) && stats.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('mission_stats').insert((stats as any[]).map((s, i) => ({ mission_id: id, label: s.label, value: s.value, sort_order: i })))
          if (e2) return { error: { message: e2.message } }
        }
      }
      if (partners !== undefined) {
        const { error: e } = await supabaseAdmin.from('mission_partners').delete().eq('mission_id', id)
        if (e) return { error: { message: e.message } }
        if (Array.isArray(partners) && partners.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('mission_partners').insert((partners as string[]).map((name, i) => ({ mission_id: id, name, sort_order: i })))
          if (e2) return { error: { message: e2.message } }
        }
      }
      if (images !== undefined) {
        const { error: e } = await supabaseAdmin.from('mission_images').delete().eq('mission_id', id)
        if (e) return { error: { message: e.message } }
        if (Array.isArray(images) && images.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('mission_images').insert((images as string[]).map((url, i) => ({
            mission_id: id, url: url.split('/').pop() || `img-${String(i + 1).padStart(2, '0')}.jpg`, alt: '', sort_order: i,
          })))
          if (e2) return { error: { message: e2.message } }
        }
      }
      if (goals !== undefined) {
        const { error: e } = await supabaseAdmin.from('mission_goals').delete().eq('mission_id', id)
        if (e) return { error: { message: e.message } }
        if (Array.isArray(goals) && goals.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('mission_goals').insert((goals as string[]).map((g, i) => ({ mission_id: id, goal: g, sort_order: i })))
          if (e2) return { error: { message: e2.message } }
        }
      }
      if (timeline !== undefined) {
        const { error: e } = await supabaseAdmin.from('mission_timeline').delete().eq('mission_id', id)
        if (e) return { error: { message: e.message } }
        if (Array.isArray(timeline) && timeline.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('mission_timeline').insert((timeline as any[]).map((t, i) => ({
            mission_id: id, title: t.title, date: t.date, description: t.description, sort_order: i,
          })))
          if (e2) return { error: { message: e2.message } }
        }
      }
      if (participants !== undefined) {
        const { error: e } = await supabaseAdmin.from('mission_participants').delete().eq('mission_id', id)
        if (e) return { error: { message: e.message } }
        if (Array.isArray(participants) && participants.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('mission_participants').insert((participants as any[]).map((p, i) => ({
            mission_id: id, group_name: p.group_name, participant_count: p.participant_count, sort_order: i,
          })))
          if (e2) return { error: { message: e2.message } }
        }
      }
      if (budget !== undefined) {
        const { error: e } = await supabaseAdmin.from('mission_budget').delete().eq('mission_id', id)
        if (e) return { error: { message: e.message } }
        if (Array.isArray(budget) && budget.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('mission_budget').insert((budget as any[]).map((b, i) => ({
            mission_id: id, item: b.item, amount: b.amount || null, sort_order: i,
          })))
          if (e2) return { error: { message: e2.message } }
        }
      }
      return { error: null }
    }
    case 'missions:delete': {
      const { id } = params
      const tables = ['mission_stats', 'mission_partners', 'mission_images', 'mission_goals', 'mission_timeline', 'mission_participants', 'mission_budget']
      for (const table of tables) {
        await supabaseAdmin.from(table as any).delete().eq('mission_id', id)
      }
      await supabaseAdmin.from('missions').delete().eq('id', id)
      return { error: null }
    }

    // Announcements
    case 'announcements:list': {
      const { data } = await supabaseAdmin.from('announcements').select('*').order('date', { ascending: false })
      return { data: data || [] }
    }
    case 'announcements:detail': {
      const { id } = params
      const { data: announcement } = await supabaseAdmin.from('announcements').select('*').eq('id', id).single()
      if (!announcement) return { data: null }
      const [tagsRes, galleryRes] = await Promise.all([
        supabaseAdmin.from('announcement_tags').select('tag').eq('announcement_id', id).order('sort_order'),
        supabaseAdmin.from('announcement_gallery').select('url, alt').eq('announcement_id', id).order('sort_order'),
      ])
      return {
        data: {
          ...announcement,
          image: announcement.image ? (announcement.image.startsWith('http') ? announcement.image : storageUrl(announcement.image.startsWith('announcements/') ? announcement.image : `announcements/${announcement.image}`)) : null,
          tags: (tagsRes.data || []).map((t: any) => t.tag),
          gallery: (galleryRes.data || []).map((g: any) => ({
            url: g.url.startsWith('http') ? g.url : storageUrl(g.url.startsWith('announcements/') ? g.url : `announcements/${g.url}`),
            alt: g.alt,
          })),
        },
      }
    }
    case 'announcements:save': {
      const { id, fields } = params
      const { tags, gallery, ...dataFields } = fields
      const { error: e1 } = await supabaseAdmin.from('announcements').upsert({ id, ...dataFields })
      if (e1) return { error: { message: e1.message } }
      if (tags !== undefined) {
        const { error: e } = await supabaseAdmin.from('announcement_tags').delete().eq('announcement_id', id)
        if (e) return { error: { message: e.message } }
        if (Array.isArray(tags) && tags.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('announcement_tags').insert((tags as string[]).map((tag, i) => ({ announcement_id: id, tag, sort_order: i })))
          if (e2) return { error: { message: e2.message } }
        }
      }
      if (gallery !== undefined) {
        const { error: e } = await supabaseAdmin.from('announcement_gallery').delete().eq('announcement_id', id)
        if (e) return { error: { message: e.message } }
        if (Array.isArray(gallery) && gallery.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('announcement_gallery').insert((gallery as string[]).map((url, i) => {
            const isFullUrl = url.startsWith('http')
            return { announcement_id: id, url: isFullUrl ? url : url.split('/').pop() || `gallery-${i}.jpg`, alt: '', sort_order: i }
          }))
          if (e2) return { error: { message: e2.message } }
        }
      }
      return { error: null }
    }
    case 'announcements:delete': {
      const { id } = params
      await supabaseAdmin.from('announcement_tags').delete().eq('announcement_id', id)
      await supabaseAdmin.from('announcement_gallery').delete().eq('announcement_id', id)
      await supabaseAdmin.from('announcements').delete().eq('id', id)
      return { error: null }
    }

    // Members
    case 'members:list': {
      const { data } = await supabaseAdmin.from('members').select('*').order('sort_order')
      if (!data) return { data: null }
      const members = data as any[]
      return {
        data: {
          teachers: members.filter((m: any) => m.group_name === 'teachers').map((m: any) => ({ ...m, image: m.image ? storageUrl(m.image.startsWith('members/') ? m.image : `members/${m.image}`) : undefined })),
          core: members.filter((m: any) => m.group_name === 'core').map((m: any) => ({ ...m, image: m.image ? storageUrl(m.image.startsWith('members/') ? m.image : `members/${m.image}`) : undefined })),
          general: members.filter((m: any) => m.group_name === 'general').map((m: any) => ({ ...m, image: m.image ? storageUrl(m.image.startsWith('members/') ? m.image : `members/${m.image}`) : undefined })),
          stats: {
            teachers: members.filter((m: any) => m.group_name === 'teachers').length,
            core: members.filter((m: any) => m.group_name === 'core').length,
            general: members.filter((m: any) => m.group_name === 'general').length,
            total: members.length,
          },
        },
      }
    }
    case 'members:save': {
      const { teachers, core, general } = params.payload
      await supabaseAdmin.from('members').delete().neq('id', 0)
      const allMembers = [
        ...(teachers || []).map((m: any, i: number) => ({ name: m.name, class: m.class || null, role: m.role, image: m.image || null, member_type: m.member_type || 'patron', group_name: 'teachers', sort_order: i })),
        ...(core || []).map((m: any, i: number) => ({ name: m.name, class: m.class || null, role: m.role, image: m.image || null, member_type: m.member_type || 'coord', group_name: 'core', sort_order: i })),
        ...(general || []).map((m: any, i: number) => ({ name: m.name, class: m.class || null, role: m.role, image: m.image || null, member_type: m.member_type || 'member', group_name: 'general', sort_order: i })),
      ].filter((m: any) => m.name.trim())
      if (allMembers.length > 0) {
        await supabaseAdmin.from('members').insert(allMembers)
      }
      return { error: null }
    }

    // Stats
    case 'stats:list': {
      const { data } = await supabaseAdmin.from('stats').select('*').order('sort_order')
      return { data: data || [] }
    }
    case 'stats:save': {
      const { items } = params
      await supabaseAdmin.from('stats').delete().neq('id', 0)
      await supabaseAdmin.from('stats').insert(items)
      return { error: null }
    }

    // Partners
    case 'partners:list': {
      const { data } = await supabaseAdmin.from('partners').select('*').order('sort_order')
      return {
        data: (data || []).map((p: any) => ({
          ...p, src: storageUrl(p.src.startsWith('partners/') ? p.src : `partners/${p.src}`),
        })),
      }
    }
    case 'partners:save': {
      const { items } = params
      await supabaseAdmin.from('partners').delete().neq('id', 0)
      await supabaseAdmin.from('partners').insert(items)
      return { error: null }
    }

    // Contact submissions
    case 'contact:list': {
      const { data } = await supabaseAdmin.from('contact_submissions').select('*').order('created_at', { ascending: false })
      return { data: data || [] }
    }
    case 'contact:delete': {
      const { id } = params
      await supabaseAdmin.from('contact_submissions').delete().eq('id', id)
      return { error: null }
    }

    // Image upload
    case 'image:upload': {
      const { bucket, path: imgPath, dataUrl } = params
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], imgPath.split('/').pop() || 'image', { type: blob.type })
      const storagePath = imgPath.startsWith('static/assets/') ? imgPath : `static/assets/${imgPath}`
      const { data, error } = await supabaseAdmin.storage.from('ruclub').upload(storagePath, file, { upsert: true })
      if (error) return { error: { message: error.message || 'Upload failed' } }
      const { data: { publicUrl } } = supabaseAdmin.storage.from('ruclub').getPublicUrl(storagePath)
      return { url: publicUrl, error: null }
    }

    // DB check
    case 'db:check': {
      const { error } = await supabaseAdmin.from('stats').select('id', { count: 'exact', head: true }).limit(1)
      return { connected: !error }
    }

    default:
      return { error: `Unknown action: ${action}` }
  }
}

function storageUrl(path: string): string {
  if (!path || path.startsWith('http')) return path
  const p = path.startsWith('/') ? path.slice(1) : path
  return `${supabaseUrl}/storage/v1/object/public/ruclub/static/assets/${p}`
}
