import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchPartners, savePartners, uploadBase64Image } from '../utils/supabase'
import { PlusIcon, XIcon, RefreshIcon, SaveIcon, ImageIcon } from './Icons'

interface PartnerItem {
  id?: number
  src: string
  alt: string
  name: string
  sort_order: number
}

export function PartnersEditorPage() {
  const addToast = useStore(s => s.addToast)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const [partners, setPartners] = useState<PartnerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [refreshTrigger])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchPartners()
      setPartners(data || [])
    } catch {
      addToast('Failed to load partners', 'error')
    }
    setLoading(false)
  }

  function update(i: number, field: 'name' | 'alt' | 'src', val: string) {
    setPartners(partners.map((p, idx) => idx === i ? { ...p, [field]: val } : p))
  }

  function remove(i: number) {
    setPartners(partners.filter((_, idx) => idx !== i))
  }

  function add() {
    setPartners([...partners, { src: '', alt: '', name: '', sort_order: partners.length }])
  }

  async function handleImageUpload(i: number) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const filename = `partners/${file.name}`
        const result = await uploadBase64Image('public', filename, dataUrl)
        if (result.url) {
          update(i, 'src', result.url)
          addToast('Image uploaded', 'success')
        } else {
          addToast('Upload failed', 'error')
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  async function handleSave() {
    setSaving(true)
    const items = partners
      .filter(p => p.name.trim())
      .map((p, i) => ({ src: p.src, alt: p.alt || p.name, name: p.name, sort_order: i }))
    const { error } = await savePartners(items)
    if (error) { addToast('Save failed: ' + error.message, 'error'); setSaving(false); return }
    addToast('Partners saved to database!', 'success')
    setSaving(false)
    load()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Partner Organizations</h2>
          <p className="mt-0.5 text-xs dark:text-zinc-600">Partner logos displayed on the homepage</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-lg border dark:border-zinc-800 px-3 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={load}>
            <RefreshIcon size={13} /> Refresh
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50" onClick={handleSave} disabled={saving}>
            <SaveIcon size={13} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <motion.div
        className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between border-b dark:border-zinc-800/50 px-4 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">{partners.length} Partner{partners.length !== 1 ? 's' : ''}</h3>
          <button className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-400" onClick={add}>
            <PlusIcon size={12} /> Add Partner
          </button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg dark:bg-zinc-800/50" />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <div className="text-sm font-medium text-zinc-500">No partners yet</div>
              <div className="text-xs dark:text-zinc-700">Click "Add Partner" to create one</div>
            </div>
          ) : (
            <div className="space-y-2">
              {partners.map((p, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 p-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div
                    className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden"
                    onClick={() => handleImageUpload(i)}
                  >
                    {p.src ? (
                      <img src={p.src} alt={p.alt} className="h-full w-full object-contain p-1" />
                    ) : (
                      <ImageIcon size={16} className="text-zinc-500" />
                    )}
                  </div>
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <input value={p.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Organization name"
                      className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
                    <input value={p.alt} onChange={e => update(i, 'alt', e.target.value)} placeholder="Alt text"
                      className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
                    <div className="sm:col-span-2">
                      <input value={p.src} onChange={e => update(i, 'src', e.target.value)} placeholder="Image URL (or click image to upload)"
                        className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50 font-mono" />
                    </div>
                  </div>
                  <button onClick={() => remove(i)}
                    className="rounded p-1.5 text-zinc-500 hover:border-red-400/50 hover:text-red-600">
                    <XIcon size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
