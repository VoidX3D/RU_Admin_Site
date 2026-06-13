import { useRef, useState, useCallback } from 'react'
import { processFiles, renameImage, uploadWithRetry } from '../../utils/image'
import { uploadBase64Image } from '../../utils/supabase'
import type { PendingImage } from '../../types'
import { UploadIcon, XIcon } from '../Icons'

let _imgKey = 0
function imgKey() { return ++_imgKey }

interface ImageUploadProps {
  images: (PendingImage & { _key?: number })[]
  onChange: (images: (PendingImage & { _key?: number })[]) => void
  maxCount?: number
  single?: boolean
  bucket?: string
  pathPrefix?: string
}

export function ImageUpload(props: ImageUploadProps) {
  const { images, onChange, maxCount, single, bucket = 'public', pathPrefix } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  async function handleFiles(files: FileList | File[]) {
    const processed = await processFiles(files, single ? 1 : maxCount)
    const withKeys = processed.map(img => ({ ...img, _key: imgKey() }))

    if (pathPrefix && withKeys.length > 0) {
      for (let i = 0; i < withKeys.length; i++) {
        const img = withKeys[i]
        if (img.dataUrl.startsWith('data:')) {
          setUploadingIndex(i)
          setUploadProgress(0)
          const progressInterval = setInterval(() => {
            setUploadProgress(p => Math.min(p + 10, 90))
          }, 300)

          const result = await uploadWithRetry(async () => {
            const filename = `${pathPrefix}/${img.name}`
            return uploadBase64Image(bucket, filename, img.dataUrl)
          })

          clearInterval(progressInterval)
          setUploadProgress(100)

          if (result.url) {
            withKeys[i] = { ...img, dataUrl: result.url, remote: true }
          }
          setUploadingIndex(null)
        }
      }
    }

    if (single) {
      onChange(withKeys.slice(0, 1))
    } else {
      onChange([...images, ...withKeys])
    }
  }

  function remove(i: number) {
    onChange(images.filter((_, idx) => idx !== i))
  }

  function moveUp(i: number) {
    if (i === 0) return
    const arr = [...images];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    onChange(arr)
  }

  function moveDown(i: number) {
    if (i === images.length - 1) return
    const arr = [...images];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    onChange(arr)
  }

  const limitReached = maxCount ? images.length >= maxCount : false

  return (
    <div>
      {uploadingIndex !== null && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-[10px] dark:text-zinc-400 mb-1">
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading image {uploadingIndex + 1} of {images.length + (uploadingIndex !== null ? 1 : 0)}...
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {!limitReached && (
        <div
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${dragOver ? 'border-emerald-500/50 dark:bg-emerald-500/5' : 'border-zinc-200 dark:border-zinc-700'} hover:border-zinc-300`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon size={24} className="text-zinc-500" />
          <span className="text-xs dark:text-zinc-400">{single ? 'Click or drag an image here' : 'Drop images here or click to browse'}</span>
          <span className="text-[10px] dark:text-zinc-600">PNG, JPG, WebP {maxCount ? `(max ${maxCount})` : ''}</span>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={!single}
            style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = '' }} />
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {images.map((img, i) => (
            <div key={img._key ?? i} className="relative aspect-video max-h-48 overflow-hidden rounded-lg border dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <img src={img.dataUrl} alt="" width="320" height="180" className="h-full w-full object-contain p-2"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <button className="absolute right-1 top-1 z-10 rounded border dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 p-0.5 dark:text-zinc-400 hover:text-red-600 dark:text-red-400" onClick={() => remove(i)}><XIcon size={14} /></button>
              {!single && (
                <>
                  <button onClick={() => moveUp(i)} disabled={i === 0}
                    className={`absolute bottom-1 left-1 z-10 rounded border dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-1.5 py-0.5 text-[11px] dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white ${i === 0 ? 'cursor-not-allowed opacity-20' : ''}`}>⟨</button>
                  <button onClick={() => moveDown(i)} disabled={i === images.length - 1}
                    className={`absolute bottom-1 left-7 z-10 rounded border dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-1.5 py-0.5 text-[11px] dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white ${i === images.length - 1 ? 'cursor-not-allowed opacity-20' : ''}`}>⟩</button>
                </>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900/90 to-transparent px-2 pb-1.5 pt-4">
                <span className="text-[10px] dark:text-white">{img.remote ? img.name : renameImage(i)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
