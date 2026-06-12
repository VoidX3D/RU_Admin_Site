import type { PendingImage } from '../types';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 4096

export function renameImage(index: number) {
  return 'img-' + String(index + 1).padStart(2, '0') + '.jpg';
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const raw = parts[1];
  if (!raw) return new Blob([], { type: mime });
  try {
    const bytes = atob(raw);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch {
    return new Blob([], { type: mime });
  }
}

function getDataUrlSize(dataUrl: string): number {
  const raw = dataUrl.split(',')[1]
  if (!raw) return 0
  return Math.ceil((raw.length * 3) / 4)
}

function compress(file: File, maxW = 1920, quality = 0.8): Promise<PendingImage> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED.has(file.type)) { reject(new Error('Invalid type')); return; }
    if (file.size > MAX_IMAGE_SIZE) { reject(new Error('File too large (max 5MB)')); return; }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
          reject(new Error('Image dimensions too large (max 4096px)'))
          return
        }
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Could not get canvas context')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const q = file.type === 'image/png' ? 0.9 : quality;
        canvas.toBlob(blob => {
          const dataUrl = canvas.toDataURL(mime, q)
          resolve({ dataUrl, name: file.name, size: blob?.size ?? getDataUrlSize(dataUrl) });
        }, mime, q);
      };
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = (e.target as FileReader).result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function processFiles(files: FileList | File[], maxCount = Infinity): Promise<PendingImage[]> {
  const results: PendingImage[] = [];
  const arr = Array.from(files);
  for (const file of arr) {
    if (!ALLOWED.has(file.type)) continue;
    try { results.push(await compress(file)); } catch {}
    if (results.length >= maxCount) break;
  }
  return results;
}

export function estimateDataUrlSize(dataUrl: string): number {
  return getDataUrlSize(dataUrl)
}

export async function uploadWithRetry(
  uploadFn: () => Promise<{ url?: string; error?: any }>,
  maxRetries = 3
): Promise<{ url?: string; error?: any }> {
  let lastError: any
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadFn()
      if (result.url) return result
      if (!result.error || attempt === maxRetries) return result
      lastError = result.error
    } catch (e) {
      lastError = e
      if (attempt === maxRetries) return { error: lastError || 'Upload failed after retries' }
    }
    await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 5000)))
  }
  return { error: lastError || 'Upload failed' }
}
