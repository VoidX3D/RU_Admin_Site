import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchPartners, savePartners, uploadBase64Image } from '../utils/supabase'
import { PlusIcon, XIcon, RefreshIcon, SaveIcon, ImageIcon, MoveUpIcon, MoveDownIcon } from './Icons'

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
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

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
    if (field === 'src') setImgErrors(prev => ({ ...prev, [i]: false }))
  }

  function remove(i: number) {
    setPartners(partners.filter((_, idx) => idx !== i))
  }

  function moveUp(i: number) {
    if (i === 0) return
    const arr = [...partners];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    setPartners(arr)
  }

  function moveDown(i: number) {
    if (i === partners.length - 1) return
    const arr = [...partners];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    setPartners(arr)
  }

  function add() {
    setPartners([...partners, { src: '', alt: '', name: '', sort_order: partners.length }])
  }

  async function handleImageUpload(i: number) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      input.remove()
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const filename = `partners/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`
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

  function validate(): boolean {
    const valid = partners.every((p, i) => {
      if (!p.name.trim()) {
        addToast(`Row ${i + 1}: Organization name is required`, 'error')
        return false
      }
      if (!p.src.trim()) {
        addToast(`Row ${i + 1}: Image is required (upload or paste URL)`, 'error')
        return false
      }
      return true
    })
    if (!valid) return false
    if (partners.length === 0) {
      addToast('Add at least one partner before saving', 'error')
      return false
    }
    return true
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    const items = partners
      .filter(p => p.name.trim())
      .map((p, i) => ({
        src: p.src,
        alt: p.alt || p.name,
        name: p.name,
        sort_order: i,
      }))

    const { error } = await savePartners(items)
    if (error) { addToast('Save failed: ' + error.message, 'error'); setSaving(false); return }
    addToast('All partners saved to database — homepage is live!', 'success')
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
          <p className="mt-0.5 text-xs dark:text-zinc-600">Logos displayed on homepage &mdash; {partners.length} partner{partners.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-lg border dark:border-zinc-800 px-3 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={load}>
            <RefreshIcon size={13} /> Refresh
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50" onClick={handleSave} disabled={saving}>
            <SaveIcon size={13} /> {saving ? 'Saving...' : 'Save to DB'}
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
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">
            {partners.length} Row{partners.length !== 1 ? 's' : ''}
          </h3>
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
              <ImageIcon size={24} className="dark:text-zinc-700" />
              <div className="text-sm font-medium text-zinc-500">No partners yet</div>
              <div className="text-xs dark:text-zinc-700">Click &ldquo;Add Partner&rdquo; to create the first row</div>
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
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUp(i)} disabled={i === 0}
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${i === 0 ? 'cursor-not-allowed opacity-20' : ''}`}>
                      <MoveUpIcon size={10} />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === partners.length - 1}
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${i === partners.length - 1 ? 'cursor-not-allowed opacity-20' : ''}`}>
                      <MoveDownIcon size={10} />
                    </button>
                  </div>

                  {/* Image preview */}
                  <div
                    className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden"
                    onClick={() => handleImageUpload(i)}
                    title="Click to upload image"
                  >
                    {p.src ? (
                      <img
                        src={p.src}
                        alt={p.alt}
                        className="h-full w-full object-contain p-1"
                        onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))}
                        onLoad={() => setImgErrors(prev => ({ ...prev, [i]: false }))}
                      />
                    ) : (
                      <ImageIcon size={18} className="text-zinc-500" />
                    )}
                    {imgErrors[i] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 text-[8px] text-red-500">broken</div>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-zinc-500">Name *</label>
                      <input value={p.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Organization name"
                        className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-zinc-500">Alt text</label>
                      <input value={p.alt} onChange={e => update(i, 'alt', e.target.value)} placeholder="Accessibility description"
                        className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-medium text-zinc-500">Image URL *</label>
                      <div className="flex items-center gap-2">
                        <input value={p.src} onChange={e => update(i, 'src', e.target.value)} placeholder="URL or click preview to upload"
                          className="flex-1 rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50 font-mono" />
                        <button onClick={() => handleImageUpload(i)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50">
                          <ImageIcon size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => remove(i)}
                    className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500">
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
