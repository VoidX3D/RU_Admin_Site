import { useRef, useState } from 'react'
import { processFiles, renameImage } from '../../utils/image'
import type { PendingImage } from '../../types'
import { UploadIcon, XIcon } from '../Icons'

let _imgKey = 0
function imgKey() { return ++_imgKey }

interface ImageUploadProps {
  images: (PendingImage & { _key?: number })[]
  onChange: (images: (PendingImage & { _key?: number })[]) => void
  maxCount?: number
  single?: boolean
}

export function ImageUpload(props: ImageUploadProps) {
  const { images, onChange, maxCount, single } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFiles(files: FileList | File[]) {
    const processed = await processFiles(files, single ? 1 : maxCount)
    const withKeys = processed.map(img => ({ ...img, _key: imgKey() }))
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
      {!limitReached && (
        <div
          className={`dropzone${dragOver ? ' dragover' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="dropzone-icon"><UploadIcon size={24} /></div>
          <div className="dropzone-text">{single ? 'Click or drag an image here' : 'Drop images here or click to browse'}</div>
          <div className="dropzone-hint">PNG, JPG, WebP {maxCount ? `(max ${maxCount})` : ''}</div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={!single}
            style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = '' }} />
        </div>
      )}

      {images.length > 0 && (
        <div className="gallery">
          {images.map((img, i) => (
            <div key={img._key ?? i} className="gallery-item">
              <img src={img.dataUrl} alt="" />
              <button className="gallery-item-remove" onClick={() => remove(i)}><XIcon size={14} /></button>
              {!single && (
                <>
                  <button className="gallery-item-reorder" onClick={() => moveUp(i)} disabled={i === 0}
                    style={{ left: 6, right: 'auto', opacity: i === 0 ? 0.2 : undefined, cursor: i === 0 ? 'not-allowed' : 'pointer' }}>⟨</button>
                  <button className="gallery-item-reorder" onClick={() => moveDown(i)} disabled={i === images.length - 1}
                    style={{ left: 38, right: 'auto', opacity: i === images.length - 1 ? 0.2 : undefined, cursor: i === images.length - 1 ? 'not-allowed' : 'pointer' }}>⟩</button>
                </>
              )}
              <div className="gallery-item-overlay">{img.remote ? img.name : renameImage(i)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
