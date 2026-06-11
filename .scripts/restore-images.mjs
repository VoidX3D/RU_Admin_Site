import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

function loadEnv() {
  const envFile = readFileSync(resolve(__dirname, '../../RU_Club_Website/.env'), 'utf-8')
  const env = {}
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = loadEnv()
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const mission01Images = Array.from({ length: 19 }, (_, i) => ({
  mission_id: 'mission-01',
  url: `img-${String(i + 1).padStart(2, '0')}.jpg`,
  alt: 'Basundhara Park Clean-up',
  sort_order: i + 1
}))

const mission03Images = Array.from({ length: 6 }, (_, i) => ({
  mission_id: 'mission-03',
  url: `img-${String(i + 1).padStart(2, '0')}.jpg`,
  alt: 'Training Day 2',
  sort_order: i + 1
}))

const allImages = [...mission01Images, ...mission03Images]

console.log(`Attempting to insert ${allImages.length} images...`)

await supabase.from('mission_images').delete().eq('mission_id', 'mission-01')
await supabase.from('mission_images').delete().eq('mission_id', 'mission-03')

const { data, error } = await supabase
  .from('mission_images')
  .insert(allImages)
  .select()

if (error) {
  console.error('INSERT failed:', error.message)
  process.exit(1)
}

console.log(`Successfully inserted ${data.length} images into mission_images`)
