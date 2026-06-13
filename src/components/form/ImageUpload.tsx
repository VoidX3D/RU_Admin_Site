import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { processFiles, uploadWithRetry, renameImage as renameFile } from '../../utils/image'
import { uploadBase64Image, deleteImage } from '../../utils/supabase'
import type { PendingImage } from '../../types'
import { UploadIcon, XIcon, StarIcon, MoveUpIcon, MoveDownIcon } from '../Icons'

let _imgKey = 0
function imgKey() { return ++_imgKey }

function renumber(imgs: (PendingImage & { _key?: number })[]): (PendingImage & { _key?: number })[] {
  return imgs.map((img, i) => ({ ...img, name: renameFile(i) }))
}

interface ImageUploadProps {
  images: (PendingImage & { _key?: number })[]
  onChange: (images: (PendingImage & { _key?: number })[]) => void
  maxCount?: number
  single?: boolean
  bucket?: string
  pathPrefix?: string
  featuredIndex?: number
  onFeaturedChange?: (index: number) => void
}

export function ImageUpload(props: ImageUploadProps) {
  const { images, onChange, maxCount, single, bucket = 'public', pathPrefix, featuredIndex, onFeaturedChange } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadingBatch, setUploadingBatch] = useState(0)
  const [uploadingTotal, setUploadingTotal] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const processed = await processFiles(files, single ? 1 : maxCount)
    const withKeys = processed.map((img) => ({
      ...img,
      _key: imgKey(),
    }))
    const startLen = images.length

    if (pathPrefix && withKeys.length > 0) {
      setUploadingBatch(0)
      setUploadingTotal(withKeys.length)
      for (let i = 0; i < withKeys.length; i++) {
        const img = withKeys[i]
        if (img.dataUrl.startsWith('data:')) {
          setUploadingBatch(i + 1)
          setUploadProgress(0)
          const progressInterval = setInterval(() => {
            setUploadProgress(p => Math.min(p + 10, 90))
          }, 300)

          const name = renameFile(startLen + i)
          const filename = `${pathPrefix}/${name}`
          const result = await uploadWithRetry(async () => {
            return uploadBase64Image(bucket, filename, img.dataUrl)
          })

          clearInterval(progressInterval)
          setUploadProgress(100)

          if (result.url) {
            withKeys[i] = { ...img, dataUrl: result.url, name, remote: true, storagePath: filename }
          }
        }
      }
      setUploadingBatch(0)
      setUploadingTotal(0)
    }

    if (single) {
      onChange(withKeys.slice(0, 1))
    } else {
      const updated = renumber([...images, ...withKeys])
      onChange(updated)
      if ((!featuredIndex || featuredIndex < 0) && onFeaturedChange && updated.length > 0 && startLen === 0) {
        onFeaturedChange(0)
      }
    }
  }, [images, onChange, maxCount, single, bucket, pathPrefix, featuredIndex, onFeaturedChange])

  async function remove(i: number) {
    const removed = images[i]
    if (removed.storagePath) {
      try {
        await deleteImage(bucket, removed.storagePath)
      } catch { /* ignore — file may not exist on server yet */ }
    }
    const updated = renumber(images.filter((_, idx) => idx !== i))
    onChange(updated)
    if (!updated.length) {
      if (onFeaturedChange) onFeaturedChange(-1)
      return
    }
    if (featuredIndex !== undefined && onFeaturedChange) {
      if (featuredIndex === i) {
        onFeaturedChange(0)
      } else if (featuredIndex > i) {
        onFeaturedChange(featuredIndex - 1)
      }
    }
  }

  function moveUp(i: number) {
    if (i === 0) return
    const arr = [...images]
    ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    onChange(renumber(arr))
    if (featuredIndex === i && onFeaturedChange) onFeaturedChange(i - 1)
    else if (featuredIndex === i - 1 && onFeaturedChange) onFeaturedChange(i)
  }

  function moveDown(i: number) {
    if (i === images.length - 1) return
    const arr = [...images]
    ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    onChange(renumber(arr))
    if (featuredIndex === i && onFeaturedChange) onFeaturedChange(i + 1)
    else if (featuredIndex === i + 1 && onFeaturedChange) onFeaturedChange(i)
  }

  const limitReached = maxCount ? images.length >= maxCount : false
  const isUploading = uploadingTotal > 0

  return (
    <div>
      <AnimatePresence>
        {isUploading && (
          <motion.div
            className="mb-3 rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="flex items-center gap-2 text-xs dark:text-emerald-400 mb-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading {uploadingBatch} of {uploadingTotal}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full dark:bg-zinc-800">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!limitReached && (
        <motion.div
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 transition-all ${dragOver
            ? 'border-emerald-500 bg-emerald-500/5 scale-[1.01]'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="rounded-full p-3 mb-1" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))' }}>
            <UploadIcon size={28} className="dark:text-zinc-400" />
          </div>
          <span className="text-sm font-medium dark:text-zinc-300">
            {single ? 'Click or drag an image here' : 'Drop images here or click to browse'}
          </span>
          <span className="text-xs dark:text-zinc-600">
            PNG, JPG, WebP — max 5MB each{maxCount ? ` (max ${maxCount})` : ''}
          </span>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={!single}
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = '' }} />
        </motion.div>
      )}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, i) => {
            const isFeatured = featuredIndex === i
            return (
              <motion.div
                key={img._key ?? i}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${isFeatured
                  ? 'border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                layout
              >
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-900 relative">
                  <img src={img.dataUrl} alt="" width="400" height="225"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />

                  {isFeatured && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                      style={{ background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(8px)' }}>
                      <StarIcon size={10} /> Featured
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-6">
                    <span className="text-[11px] text-white/90 font-medium truncate block">
                      {renameFile(i)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 py-1.5 border-t dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    {onFeaturedChange && (
                      <button
                        onClick={() => onFeaturedChange(i)}
                        className={`rounded p-1 transition-colors ${isFeatured
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : 'dark:text-zinc-600 hover:text-amber-400 dark:hover:text-amber-400'
                        }`}
                        title="Set as featured image"
                      >
                        <StarIcon size={14} />
                      </button>
                    )}

                    {!single && (
                      <>
                        <button onClick={() => moveUp(i)} disabled={i === 0}
                          className={`rounded p-1 transition-colors dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white ${i === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                          title="Move left">
                          <MoveUpIcon size={14} />
                        </button>
                        <button onClick={() => moveDown(i)} disabled={i === images.length - 1}
                          className={`rounded p-1 transition-colors dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white ${i === images.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                          title="Move right">
                          <MoveDownIcon size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => remove(i)}
                    className="rounded p-1 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Remove image"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {!single && images.length > 1 && (
        <div className="mt-2 text-[10px] dark:text-zinc-700 flex items-center gap-1.5">
          <StarIcon size={10} className="dark:text-emerald-500" />
          Click the star to set the featured cover image
        </div>
      )}
    </div>
  )
}
