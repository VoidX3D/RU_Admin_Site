import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore, getDrafts } from '../store'
import { Storage } from '../utils/storage'
import { saveMission, saveAnnouncement, saveMembers, uploadBase64Image } from '../utils/supabase'
import { CheckCircleIcon, AlertTriangleIcon, XIcon, LoaderIcon, DatabaseIcon } from './Icons'
import type { PendingImage } from '../types'

interface Props { open: boolean; onClose: () => void }

type Step = 'confirm' | 'publishing' | 'done'

export function PRDialog({ open, onClose }: Props) {
  const addToast = useStore(s => s.addToast)
  const triggerRefresh = useStore(s => s.triggerRefresh)
  const [step, setStep] = useState<Step>('confirm')
  const [pubError, setPubError] = useState('')
  const [successCount, setSuccessCount] = useState(0)

  const drafts = getDrafts()

  useEffect(() => {
    if (open) {
      setStep('confirm'); setPubError(''); setSuccessCount(0)
    }
  }, [open])

  async function handlePublish() {
    if (!drafts.length) { addToast('No drafts to publish', 'error'); return }

    setStep('publishing')
    let published = 0

    try {
      for (const draft of drafts) {
        const d = draft as unknown as Record<string, unknown>

        if (d.type === 'mission') {
          const images = (d.images as PendingImage[]) || []
          const imageUrls: string[] = []

          for (let i = 0; i < images.length; i++) {
            if (images[i].remote && images[i].dataUrl.startsWith('http')) {
              imageUrls.push(images[i].dataUrl)
            } else if (images[i].dataUrl.startsWith('data:')) {
              const filename = `missions/${d.id}/img-${String(i + 1).padStart(2, '0')}.jpg`
              const result = await uploadBase64Image('public', filename, images[i].dataUrl)
              if (result.url) imageUrls.push(result.url)
            }
          }

          const stats = (d.stats as { key: string; value: string }[]) || []
          const statsObj: Record<string, string> = {}
          stats.forEach(s => { if (s.key) statsObj[s.key] = s.value })

          const { error } = await saveMission(d.id as string, {
            slug: d.id,
            title: d.title,
            tag: d.tag,
            date: d.date,
            description: d.description,
            detail: d.detail,
            show: d.show !== false,
            image_count: images.length,
            featured: imageUrls[0] || null,
            images: imageUrls,
            stats: statsObj,
            partners: (d.partners as string[]) || [],
          })
          if (error) throw error
          Storage.deleteDraft('mission', d.id as string)
          published++

        } else if (d.type === 'announcement') {
          let imageUrl = (d.image as PendingImage)?.dataUrl || null
          if (imageUrl?.startsWith('data:')) {
            const filename = `announcements/${d.id}.jpg`
            const result = await uploadBase64Image('public', filename, imageUrl)
            if (result.url) imageUrl = result.url
          } else if (imageUrl?.startsWith('http')) {
            // keep as-is
          } else {
            imageUrl = null
          }

          const { error } = await saveAnnouncement(d.id as string, {
            title: d.title,
            tag: d.tag || 'Update',
            status: d.status || '',
            date: d.date,
            day: d.day || '',
            time: d.time || '',
            location: d.location || '',
            issued_by: d.issuedBy || '',
            summary: d.summary,
            description: d.description || '',
            importance: d.importance || '',
            instructions: d.instructions || '',
            deadline: d.deadline || '',
            active: d.active !== false,
            image: imageUrl,
          })
          if (error) throw error
          Storage.deleteDraft('announcement', d.id as string)
          published++

        } else if (d.type === 'members') {
          const membersData = d as unknown as { teachers?: { name: string }[]; core?: { name: string }[]; general?: { name: string }[] }
          const filtered = {
            teachers: (membersData.teachers || []).filter((m: { name: string }) => m.name?.trim()),
            core: (membersData.core || []).filter((m: { name: string }) => m.name?.trim()),
            general: (membersData.general || []).filter((m: { name: string }) => m.name?.trim()),
          }
          const stats = {
            teachers: filtered.teachers.length,
            core: filtered.core.length,
            general: filtered.general.length,
            total: filtered.teachers.length + filtered.core.length + filtered.general.length,
          }
          const { error } = await saveMembers({ ...filtered, stats })
          if (error) throw error
          Storage.deleteDraft('members', 'members')
          published++
        }
      }

      setSuccessCount(published)
      setStep('done')
      triggerRefresh()
      addToast(`Published ${published} item${published !== 1 ? 's' : ''} to database!`, 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setPubError(msg)
      addToast('Publish failed: ' + msg, 'error')
      setStep('confirm')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-xl border dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-xl dark:shadow-black/40"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b dark:border-zinc-800/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg dark:bg-zinc-900 ${step === 'done' ? 'text-emerald-400' : 'text-emerald-400'}`}>
              {step === 'done' ? <CheckCircleIcon size={18} /> : <DatabaseIcon size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                {step === 'confirm' && 'Publish to Database'}
                {step === 'publishing' && 'Publishing...'}
                {step === 'done' && 'Published!'}
              </h3>
              <p className="text-[11px] dark:text-zinc-600">
                {step === 'confirm' && `${drafts.length} draft${drafts.length !== 1 ? 's' : ''} to publish`}
                {step === 'publishing' && 'Writing to Supabase...'}
                {step === 'done' && `${successCount} item${successCount !== 1 ? 's' : ''} published`}
              </p>
            </div>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg dark:text-zinc-300 dark:hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-700" onClick={onClose}>
            <XIcon size={16} />
          </button>
        </div>

        <div className="p-4">
          {step === 'confirm' && (
            <div>
              {pubError && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border dark:border-red-800/30 dark:bg-red-500/5 px-3 py-2 text-xs dark:text-red-400">
                  <AlertTriangleIcon size={13} /> {pubError}
                </div>
              )}

              <div className="mb-4 rounded-lg border dark:border-zinc-800/30 dark:bg-zinc-900/20 p-3">
                <p className="text-xs dark:text-zinc-400">
                  This will publish all your drafts directly to the Supabase database.
                  Changes will be live immediately on the website.
                </p>
              </div>

              <div className="mb-4 space-y-2">
                {drafts.map(d => (
                  <div key={d.id} className="flex items-center gap-2 rounded-lg dark:bg-zinc-900/50 px-3 py-2">
                    <DatabaseIcon size={12} className="dark:text-emerald-500" />
                    <span className="flex-1 text-xs font-medium dark:text-zinc-300 truncate">{d.title || d.id}</span>
                    <span className="rounded dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium dark:text-zinc-500 capitalize">{d.type}</span>
                  </div>
                ))}
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-white dark:hover:bg-emerald-400"
                onClick={handlePublish}
              >
                <DatabaseIcon size={15} /> Publish All
              </button>
            </div>
          )}

          {step === 'publishing' && (
            <div className="py-6 text-center">
              <LoaderIcon size={24} className="mx-auto animate-spin dark:text-emerald-400" />
              <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">Publishing...</p>
              <p className="mt-1 text-xs dark:text-zinc-600">Writing to Supabase database</p>
            </div>
          )}

          {step === 'done' && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full dark:bg-emerald-500/15">
                <CheckCircleIcon size={28} className="dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Published!</h3>
              <p className="mt-1 text-xs dark:text-zinc-600">
                {successCount} item{successCount !== 1 ? 's' : ''} saved to Supabase
              </p>
              <p className="mt-0.5 text-[11px] dark:text-zinc-700">
                Changes are live on the website
              </p>
              <button
                className="mt-6 rounded-lg border dark:border-zinc-800 px-4 py-2.5 text-xs font-medium dark:text-zinc-300 dark:hover:bg-zinc-200/50 dark:bg-zinc-800/50 dark:hover:text-zinc-700"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
