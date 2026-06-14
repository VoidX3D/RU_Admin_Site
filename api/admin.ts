import { createClient } from '@supabase/supabase-js'
import { createHmac, createHash, createSign, createVerify } from 'node:crypto'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
// Fallback to anon key so the API works even when SUPABASE_SERVICE_KEY is not set.
// In production, always set SUPABASE_SERVICE_KEY in Vercel env vars for security.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ADMIN_USER = process.env.ADMIN_USERNAME || ''
const ADMIN_PASS = process.env.ADMIN_PASSWORD || ''
const MASTER_KEY = process.env.MASTER_KEY || ''
// Deterministic fallback so sessions survive Vercel cold starts when SUPABASE_JWT_SECRET is unset.
// In production, always set SUPABASE_JWT_SECRET in Vercel environment variables.
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || createHash('sha256').update(supabaseUrl + supabaseServiceKey).digest('hex')
// ECDSA P-256 private key (PEM) for ES256 JWT signing. Set in Vercel env for production.
// Generate: openssl ecparam -genkey -name prime256v1 -noout -out ec-private.pem
// Copy the full PEM (including BEGIN/END lines) into JWT_EC_PRIVATE_KEY env var.
// Falls back to HS256 when unset.
const EC_PRIVATE_KEY = process.env.JWT_EC_PRIVATE_KEY || ''

const USE_ES256 = !!EC_PRIVATE_KEY

function b64url(s: string) { return Buffer.from(s).toString('base64url') }
function fromB64url(s: string) { return Buffer.from(s, 'base64url').toString() }

function signToken(user: string) {
  const header = b64url(JSON.stringify({ alg: USE_ES256 ? 'ES256' : 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({ user, exp: Date.now() + 604800000 }))
  const data = `${header}.${payload}`
  if (USE_ES256) {
    const signer = createSign('sha256')
    signer.update(data)
    signer.end()
    const sig = signer.sign(EC_PRIVATE_KEY, 'base64url')
    return `${data}.${sig}`
  }
  const sig = createHmac('sha256', JWT_SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verifyToken(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const { user, exp } = JSON.parse(fromB64url(parts[1]))
    if (Date.now() > exp) return null
    const data = `${parts[0]}.${parts[1]}`
    const sig = parts[2]

    // Try ES256 first if configured (handles tokens signed after upgrade)
    if (USE_ES256) {
      try {
        const verifier = createVerify('sha256')
        verifier.update(data)
        verifier.end()
        if (verifier.verify(EC_PRIVATE_KEY, sig, 'base64url')) return { user }
      } catch {}
    }

    // Fall back to HS256 (handles legacy tokens or when ES256 is unset)
    const expectedSig = createHmac('sha256', JWT_SECRET).update(data).digest('base64url')
    if (expectedSig === sig) return { user }

    return null
  } catch { return null }
}

function isValidUser(username: string) {
  if (username === ADMIN_USER) return true
  if (ADMIN_USER.includes('@') && username === ADMIN_USER.split('@')[0]) return true
  return false
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, token: tokenStr, ...params } = req.body

  if (action === 'login') {
    const { username, password } = params

    if (!ADMIN_USER && !MASTER_KEY) {
      return res.status(500).json({ error: { message: 'Admin credentials not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD in Vercel env vars.' } })
    }

    if (MASTER_KEY && password === MASTER_KEY) {
      return res.json({ token: signToken('master'), user: username || 'master' })
    }

    if (!username || !password) return res.status(400).json({ error: { message: 'Missing credentials' } })
    if (!isValidUser(username)) return res.status(401).json({ error: { message: 'Invalid credentials' } })
    if (password !== ADMIN_PASS) return res.status(401).json({ error: { message: 'Invalid credentials' } })

    return res.json({ token: signToken(username), user: username })
  }

  const session = verifyToken(tokenStr || '')
  if (!session) return res.status(401).json({ error: 'Invalid or expired token' })

  try {
    const result = await handleAction(action, params)
    return res.json(result)
  } catch (err: any) {
    console.error(`[${action}] Error:`, err)
    const message = err?.message || 'Internal server error'
    if (message.includes('relation') || message.includes('does not exist')) {
      return res.status(500).json({ error: { message: 'Database schema missing — run migration SQL in Supabase', code: 'SCHEMA' } })
    }
    if (message.includes('JWT') || message.includes('jwt')) {
      return res.status(401).json({ error: { message: 'JWT verification failed' } })
    }
    return res.status(500).json({ error: { message } })
  }
}

async function handleAction(action: string, params: any) {
  switch (action) {
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
            url: i.url.startsWith('http') ? i.url : storageUrl(`mission/${mission.slug}/${i.url}`),
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
      const { error: e } = await supabaseAdmin.from('missions').upsert({ id, ...missionFields })
      if (e) return { error: { message: e.message } }
      const ops: Promise<{ error?: any }>[] = []
      if (stats !== undefined) {
        ops.push(
          supabaseAdmin.from('mission_stats').delete().eq('mission_id', id).then(() => {
            if (Array.isArray(stats) && stats.length > 0) {
              return supabaseAdmin.from('mission_stats').insert((stats as any[]).map((s, i) => ({ mission_id: id, label: s.label, value: s.value, sort_order: i })))
            }
            return { error: null }
          })
        )
      }
      if (partners !== undefined) {
        ops.push(
          supabaseAdmin.from('mission_partners').delete().eq('mission_id', id).then(() => {
            if (Array.isArray(partners) && partners.length > 0) {
              return supabaseAdmin.from('mission_partners').insert((partners as string[]).map((name, i) => ({ mission_id: id, name, sort_order: i })))
            }
            return { error: null }
          })
        )
      }
      if (images !== undefined) {
        const urls = Array.isArray(images) ? images : []
        if (urls.length === 0 && missionFields.featured) {
          urls.push(missionFields.featured)
        }
        ops.push(
          supabaseAdmin.from('mission_images').delete().eq('mission_id', id).then(() => {
            if (urls.length > 0) {
              return supabaseAdmin.from('mission_images').insert(urls.map((url, i) => ({
                mission_id: id, url: url.startsWith('http') ? url.split('/').pop()! : url.split('/').pop() || `img-${String(i + 1).padStart(2, '0')}.jpg`, alt: '', sort_order: i,
              })))
            }
            return { error: null }
          })
        )
      }
      if (goals !== undefined) {
        ops.push(
          supabaseAdmin.from('mission_goals').delete().eq('mission_id', id).then(() => {
            if (Array.isArray(goals) && goals.length > 0) {
              return supabaseAdmin.from('mission_goals').insert((goals as string[]).map((g, i) => ({ mission_id: id, goal: g, sort_order: i })))
            }
            return { error: null }
          })
        )
      }
      if (timeline !== undefined) {
        ops.push(
          supabaseAdmin.from('mission_timeline').delete().eq('mission_id', id).then(() => {
            if (Array.isArray(timeline) && timeline.length > 0) {
              return supabaseAdmin.from('mission_timeline').insert((timeline as any[]).map((t, i) => ({
                mission_id: id, title: t.title, date: t.date, description: t.description, sort_order: i,
              })))
            }
            return { error: null }
          })
        )
      }
      if (participants !== undefined) {
        ops.push(
          supabaseAdmin.from('mission_participants').delete().eq('mission_id', id).then(() => {
            if (Array.isArray(participants) && participants.length > 0) {
              return supabaseAdmin.from('mission_participants').insert((participants as any[]).map((p, i) => ({
                mission_id: id, group_name: p.group_name, participant_count: p.participant_count, sort_order: i,
              })))
            }
            return { error: null }
          })
        )
      }
      if (budget !== undefined) {
        ops.push(
          supabaseAdmin.from('mission_budget').delete().eq('mission_id', id).then(() => {
            if (Array.isArray(budget) && budget.length > 0) {
              return supabaseAdmin.from('mission_budget').insert((budget as any[]).map((b, i) => ({
                mission_id: id, item: b.item, amount: b.amount || null, sort_order: i,
              })))
            }
            return { error: null }
          })
        )
      }
      const results = await Promise.all(ops)
      const firstError = results.find(r => r.error)
      if (firstError) return { error: { message: firstError.error.message } }
      await logAction('missions:save', 'mission', id, `Saved mission "${missionFields.title || id}"`)
      return { error: null }
    }
    case 'missions:delete': {
      const { id } = params
      const tables = ['mission_stats', 'mission_partners', 'mission_images', 'mission_goals', 'mission_timeline', 'mission_participants', 'mission_budget']
      await Promise.all(tables.map(table => supabaseAdmin.from(table as any).delete().eq('mission_id', id)))
      await supabaseAdmin.from('missions').delete().eq('id', id)
      await logAction('missions:delete', 'mission', id, `Deleted mission ${id}`)
      return { error: null }
    }

    case 'announcements:list': {
      const { data } = await supabaseAdmin.from('announcements').select('*').order('date', { ascending: false })
      return { data: data || [] }
    }
    case 'announcements:detail': {
      const { id } = params
      const { data: announcement } = await supabaseAdmin.from('announcements').select('*').eq('id', id).single()
      if (!announcement) return { data: null }
      const { data: tags } = await supabaseAdmin.from('announcement_tags').select('tag').eq('announcement_id', id).order('sort_order')
      return {
        data: {
          ...announcement,
          image: announcement.image ? (announcement.image.startsWith('http') ? announcement.image : storageUrl(announcement.image.startsWith('announcements/') ? announcement.image : `announcements/${announcement.image}`)) : null,
          tags: (tags || []).map((t: any) => t.tag),
        },
      }
    }
    case 'announcements:save': {
      const { id, fields } = params
      const { tags, ...dataFields } = fields
      if (dataFields.image) {
        if (dataFields.image.startsWith('http') && !dataFields.image.includes(supabaseUrl)) {
          const stored = await downloadAndUploadImage(dataFields.image, 'announcements', id)
          if (stored) dataFields.image = stored
        }
        dataFields.image = normalizeImagePath(dataFields.image) || dataFields.image
      }
      const { error: e } = await supabaseAdmin.from('announcements').upsert({ id, ...dataFields })
      if (e) return { error: { message: e.message } }
      if (tags !== undefined) {
        await supabaseAdmin.from('announcement_tags').delete().eq('announcement_id', id)
        if (Array.isArray(tags) && tags.length > 0) {
          const { error: e2 } = await supabaseAdmin.from('announcement_tags').insert((tags as string[]).map((tag, i) => ({ announcement_id: id, tag, sort_order: i })))
          if (e2) return { error: { message: e2.message } }
        }
      }
      await logAction('announcements:save', 'announcement', id, `Saved announcement "${dataFields.title || id}"`)
      return { error: null }
    }
    case 'announcements:delete': {
      const { id } = params
      await supabaseAdmin.from('announcement_tags').delete().eq('announcement_id', id)
      await supabaseAdmin.from('announcements').delete().eq('id', id)
      await logAction('announcements:delete', 'announcement', id, `Deleted announcement ${id}`)
      return { error: null }
    }

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
      // Download any external image URLs before saving
      for (const group of [teachers, core, general]) {
        for (const m of group || []) {
          if (m.image && m.image.startsWith('http') && !m.image.includes(supabaseUrl)) {
            const stored = await downloadAndUploadImage(m.image, 'members', m.name)
            if (stored) m.image = stored
          }
        }
      }
      await supabaseAdmin.from('members').delete().neq('id', 0)
      const allMembers = [
        ...(teachers || []).map((m: any, i: number) => ({ name: m.name, class: m.class || null, role: m.role, image: normalizeImagePath(m.image), member_type: m.member_type || 'patron', group_name: 'teachers', sort_order: i })),
        ...(core || []).map((m: any, i: number) => ({ name: m.name, class: m.class || null, role: m.role, image: normalizeImagePath(m.image), member_type: m.member_type || 'coord', group_name: 'core', sort_order: i })),
        ...(general || []).map((m: any, i: number) => ({ name: m.name, class: m.class || null, role: m.role, image: normalizeImagePath(m.image), member_type: m.member_type || 'member', group_name: 'general', sort_order: i })),
      ].filter((m: any) => m.name.trim())
      const memberCount = allMembers.length
      if (allMembers.length > 0) {
        await supabaseAdmin.from('members').insert(allMembers)
      }
      await logAction('members:save', 'member', null, `Saved ${memberCount} members`)
      return { error: null }
    }

    case 'stats:list': {
      const { data } = await supabaseAdmin.from('stats').select('*').order('sort_order')
      return { data: data || [] }
    }
    case 'stats:save': {
      const { items } = params
      await supabaseAdmin.from('stats').delete().neq('id', 0)
      await supabaseAdmin.from('stats').insert(items)
      await logAction('stats:save', 'stats', null, `Updated ${items?.length || 0} stats`)
      return { error: null }
    }

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
      // Download external image URLs for partners
      for (const p of items || []) {
        if (p.src && p.src.startsWith('http') && !p.src.includes(supabaseUrl)) {
          const stored = await downloadAndUploadImage(p.src, 'partners', p.name || 'partner')
          if (stored) p.src = stored
        }
      }
      await supabaseAdmin.from('partners').delete().neq('id', 0)
      await supabaseAdmin.from('partners').insert(items.map((p: any) => ({ ...p, src: normalizeImagePath(p.src) || p.src })))
      await logAction('partners:save', 'partner', null, `Saved ${items?.length || 0} partners`)
      return { error: null }
    }

    case 'contact:list': {
      const { data } = await supabaseAdmin.from('contact_submissions').select('*').order('created_at', { ascending: false })
      return { data: data || [] }
    }
    case 'contact:delete': {
      const { id } = params
      await supabaseAdmin.from('contact_submissions').delete().eq('id', id)
      await logAction('contact:delete', 'contact', String(id), `Deleted contact submission ${id}`)
      return { error: null }
    }

    case 'image:upload': {
      const { bucket, path: imgPath, dataUrl } = params
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) return { error: { message: 'Invalid data URL format' } }
      const mimeType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')
      const ext = mimeType.split('/').pop() || 'jpg'
      const storagePath = imgPath.startsWith('static/assets/') ? imgPath : `static/assets/${imgPath}`
      const { data, error } = await supabaseAdmin.storage.from('ruclub').upload(storagePath, buffer, { contentType: mimeType, upsert: true })
      if (error) return { error: { message: error.message || 'Upload failed' } }
      const { data: { publicUrl } } = supabaseAdmin.storage.from('ruclub').getPublicUrl(storagePath)
      await logAction('image:upload', 'image', storagePath, `Uploaded image ${imgPath}`)
      return { url: publicUrl, error: null }
    }

    case 'image:delete': {
      const { path: imgPath } = params
      if (!imgPath) return { error: { message: 'No path provided' } }
      const basePath = imgPath.startsWith('static/assets/') ? imgPath : `static/assets/${imgPath}`
      const webpPath = basePath.replace(/\.(jpe?g|png|gif)$/i, '.webp')
      const toDelete = basePath === webpPath ? [basePath] : [basePath, webpPath]
      const { error } = await supabaseAdmin.storage.from('ruclub').remove(toDelete)
      if (error && !error.message?.includes('not found')) {
        return { error: { message: error.message || 'Delete failed' } }
      }
      if (toDelete.length > 1) {
        console.log(`[image:delete] Removed ${toDelete.join(', ')}`)
      }
      await logAction('image:delete', 'image', imgPath, `Deleted image ${imgPath}${toDelete.length > 1 ? ' + webp' : ''}`)
      return { error: null }
    }

    case 'images:rename-all': {
      const renamed = { missions: 0, announcements: 0 }

      const { data: missions } = await supabaseAdmin.from('missions').select('id, slug')
      if (missions) {
        for (const mission of missions) {
          const { data: images } = await supabaseAdmin.from('mission_images')
            .select('id, url')
            .eq('mission_id', mission.id)
            .order('sort_order')

          if (!images || images.length === 0) continue

          const slug = mission.slug
          let changed = false

          for (let i = 0; i < images.length; i++) {
            const img = images[i]
            const oldName = img.url.split('/').pop()
            const newName = `img-${String(i + 1).padStart(2, '0')}.jpg`

            if (oldName === newName) continue

            const oldPath = `static/assets/mission/${slug}/${oldName}`
            const newPath = `static/assets/mission/${slug}/${newName}`

            const { error: downloadErr, data: fileData } = await supabaseAdmin.storage.from('ruclub').download(oldPath)
            if (downloadErr) {
              console.error(`[rename-mission] Cannot download ${oldPath}: ${downloadErr.message}`)
              continue
            }

            const { error: uploadErr } = await supabaseAdmin.storage.from('ruclub').upload(newPath, fileData, { contentType: fileData.type, upsert: true })
            if (uploadErr) {
              console.error(`[rename-mission] Cannot upload ${newPath}: ${uploadErr.message}`)
              continue
            }

            await supabaseAdmin.storage.from('ruclub').remove([oldPath])

            await supabaseAdmin.from('mission_images').update({ url: newName }).eq('id', img.id)
            changed = true
          }

          if (changed) renamed.missions++
        }
      }

      const { data: announcements } = await supabaseAdmin.from('announcements').select('id, image').not('image', 'is', null)
      if (announcements) {
        for (const ann of announcements) {
          const oldName = ann.image.split('/').pop()
          if (!oldName || oldName.startsWith('http')) continue
          if (oldName === 'featured.jpg') continue

          const oldPath = `static/assets/announcements/${oldName}`
          const newPath = `static/assets/announcements/featured.jpg`

          const { error: downloadErr, data: fileData } = await supabaseAdmin.storage.from('ruclub').download(oldPath)
          if (downloadErr) {
            console.error(`[rename-announcement] Cannot download ${oldPath}: ${downloadErr.message}`)
            continue
          }

          const { error: uploadErr } = await supabaseAdmin.storage.from('ruclub').upload(newPath, fileData, { contentType: fileData.type, upsert: true })
          if (uploadErr) {
            console.error(`[rename-announcement] Cannot upload ${newPath}: ${uploadErr.message}`)
            continue
          }

          await supabaseAdmin.storage.from('ruclub').remove([oldPath])

          await supabaseAdmin.from('announcements').update({ image: 'featured.jpg' }).eq('id', ann.id)
          renamed.announcements++
        }
      }

      return { data: renamed }
    }

    case 'db:check': {
      const { error } = await supabaseAdmin.from('stats').select('id', { count: 'exact', head: true }).limit(1)
      return { connected: !error }
    }

    case 'logs:list': {
      const { limit: logLimit = 100, offset: logOffset = 0 } = params
      const { data, error } = await supabaseAdmin.from('admin_logs')
        .select('id, action, details, entity_type, entity_id, created_at')
        .order('created_at', { ascending: false })
        .range(logOffset, logOffset + logLimit - 1)
      if (error) return { error: { message: error.message } }
      return { data: data || [] }
    }

    case 'logs:clear': {
      const { error } = await supabaseAdmin.from('admin_logs').delete().neq('id', 0)
      if (error) return { error: { message: error.message } }
      await logAction('logs:clear', 'log', null, 'Cleared all activity logs')
      return { error: null }
    }

    default:
      return { error: `Unknown action: ${action}` }
  }
}

function storageUrl(path: string): string {
  if (!path || path.startsWith('http')) return path
  const p = path.startsWith('/') ? path.slice(1) : path
  return `${supabaseUrl}/storage/v1/render/image/public/ruclub/static/assets/${p}?format=webp`
}

function normalizeImagePath(path: string | null | undefined): string | null {
  if (!path) return null
  const clean = path.split('?')[0]
  if (clean.startsWith('http')) {
    const marker = '/static/assets/'
    const idx = clean.indexOf(marker)
    if (idx !== -1) return clean.slice(idx + marker.length)
    return clean.split('/').pop() || clean
  }
  return clean
}

async function downloadAndUploadImage(url: string, entityType: string, entityId: string): Promise<string | null> {
  if (url.includes(supabaseUrl)) {
    const marker = '/static/assets/'
    const idx = url.indexOf(marker)
    if (idx !== -1) {
      const rel = url.slice(idx + marker.length).split('?')[0]
      return rel
    }
    return url.split('/').pop()?.split('?')[0] || null
  }

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())
    const ext = contentType.split('/').pop() || 'jpg'
    const safeId = entityId.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase().slice(0, 30)
    const timestamp = Date.now()
    const filename = `${entityType}_${safeId}_${timestamp}.${ext}`
    const storagePath = `static/assets/${entityType}/${filename}`
    const { error } = await supabaseAdmin.storage.from('ruclub').upload(storagePath, buffer, { contentType, upsert: true })
    if (error) {
      console.error(`[downloadAndUploadImage] Upload error: ${error.message}`)
      return null
    }
    const relative = `${entityType}/${filename}`
    console.log(`[downloadAndUploadImage] Saved ${url} → ${relative}`)
    return relative
  } catch (e) {
    console.error(`[downloadAndUploadImage] Failed to download ${url}:`, e)
    return null
  }
}

async function logAction(action: string, entityType: string | null, entityId: string | null, details: string | null) {
  try {
    await supabaseAdmin.from('admin_logs').insert({
      action,
      details,
      entity_type: entityType,
      entity_id: entityId,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error(`[logAction] Failed to log:`, e)
  }
}
