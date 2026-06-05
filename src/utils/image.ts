import type { PendingImage } from '../types';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

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

function compress(file: File, maxW = 1920, quality = 0.8): Promise<PendingImage> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED.includes(file.type)) { reject(new Error('Invalid type')); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
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
          resolve({ dataUrl: canvas.toDataURL(mime, q), name: file.name, size: blob!.size });
        }, mime, q);
      };
      img.onerror = reject;
      img.src = (e.target as FileReader).result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function processFiles(files: FileList | File[], maxCount = Infinity): Promise<PendingImage[]> {
  const results: PendingImage[] = [];
  const arr = Array.from(files);
  for (const file of arr) {
    if (!ALLOWED.includes(file.type)) continue;
    try { results.push(await compress(file)); } catch {}
    if (results.length >= maxCount) break;
  }
  return results;
}
