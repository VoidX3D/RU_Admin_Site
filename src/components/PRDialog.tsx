import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore, getDrafts } from '../store'
import { Storage } from '../utils/storage'
import { getEnvConfig } from '../utils/env'
import {
 createBranch, commitFile, commitBinary, createPR, getFileSha,
 getNextBranchName,
} from '../utils/github'
import { dataUrlToBlob } from '../utils/image'
import { generatePRBody } from '../utils/prTemplates'
import { prepareFileDiffs } from '../utils/diff'
import type { FileDiff } from '../utils/diff'
import { savePublishRecord } from '../utils/history'
import type { PublishFile } from '../utils/history'
import { DiffView } from './DiffView'
import { GitPullRequestIcon, CheckCircleIcon, AlertTriangleIcon, XIcon, LoaderIcon, LockIcon, ExternalLinkIcon } from './Icons'

interface Props { open: boolean; onClose: () => void }

type Step = 'verify' | 'review' | 'publishing' | 'done'

async function dataUrlToBase64Async(dataUrl: string): Promise<string> {
 const blob = dataUrlToBlob(dataUrl)
 return new Promise<string>((resolve, reject) => {
 const fr = new FileReader()
 fr.onloadend = () => resolve((fr.result as string).split(',')[1])
 fr.onerror = () => reject(new Error('Failed'))
 fr.readAsDataURL(blob)
 })
}

function draftFileCount(d: { type: string; imageCount?: number; image?: unknown }): number {
 let n = 1
 if (d.type === 'mission') n += d.imageCount || 0
 else if (d.type === 'announcement' && d.image) n += 1
 return n
}

export function PRDialog({ open, onClose }: Props) {
 const addToast = useStore(s => s.addToast)
 const [step, setStep] = useState<Step>('verify')
 const [code, setCode] = useState('')
 const [codeErr, setCodeErr] = useState('')
 const [prUrl, setPrUrl] = useState('')
 const [prNumber, setPrNumber] = useState<number | null>(null)
 const [pubError, setPubError] = useState('')
 const [diffs, setDiffs] = useState<FileDiff[]>([])
 const [commitMsg, setCommitMsg] = useState('')
 const [loadingDiffs, setLoadingDiffs] = useState(false)

 const drafts = getDrafts()
 const settings = Storage.getSettings()
 const envToken = getEnvConfig().GITHUB_TOKEN || ''
 const totalFiles = drafts.reduce((s, d) => s + draftFileCount(d), 0)

 useEffect(() => {
 if (open) {
 setStep('verify'); setCode(''); setCodeErr(''); setPrUrl('')
 setPrNumber(null)
 setPubError(''); setDiffs([])
 setCommitMsg(''); setLoadingDiffs(false)
 }
 }, [open])

 async function handleVerify() {
 setCodeErr('')
 if (!code.trim()) { setCodeErr('Enter the verification code'); return }
 if (code.trim() !== settings.verifyCode) {
 setCodeErr('Invalid code. Only authorized club members can publish.')
 return
 }
 if (!drafts.length) { addToast('No drafts to publish', 'error'); return }
 if (!envToken) { addToast('GitHub token not configured', 'error'); return }

 setPubError('')
 setLoadingDiffs(true)
 setStep('review')

 try {
 const fetchCurrent = async (path: string): Promise<string | null> => {
 try {
 const url = `https://raw.githubusercontent.com/${settings.repoOwner}/${settings.repoName}/${settings.repoBranch}/${path}`
 const res = await fetch(url)
 return res.ok ? res.text() : null
 } catch { return null }
 }

 const fileDiffs = await prepareFileDiffs(drafts, fetchCurrent)
 setDiffs(fileDiffs)
 const defaultMsg = `Update ${fileDiffs.map(d => d.path.split('/').pop()).filter(Boolean).join(', ')}`
 setCommitMsg(defaultMsg)
 } catch {
 setPubError('Could not load file changes. Check your GitHub token and try again.')
 setStep('verify'); setDiffs([]); setLoadingDiffs(false)
 }
 setLoadingDiffs(false)
 }

 async function handlePublish() {
 if (!drafts.length) { addToast('No drafts to publish', 'error'); return }
 if (!envToken) { addToast('GitHub token not configured', 'error'); return }

 setStep('publishing')

 try {
 const prBody = commitMsg
 ? `## Summary\n\n${commitMsg}\n\n---\n\n*Automated via RU Club Admin Panel*`
 : generatePRBody(drafts, 'standard')

 const branch = await getNextBranchName(envToken, settings.repoOwner, settings.repoName)
 await createBranch(envToken, settings.repoOwner, settings.repoName, settings.repoBranch, branch)

 async function getSha(path: string): Promise<string | null> {
 return getFileSha(envToken, settings.repoOwner, settings.repoName, path, settings.repoBranch)
 }

 for (const draft of drafts) {
 const d = draft as unknown as Record<string, unknown>
 if (d.type === 'mission') {
 const imageCount = (d.imageCount as number) || (d.images as { dataUrl: string; name: string }[])?.length || 0
 const filenames: string[] = Array.from({ length: imageCount }, (_, i) => `img-${String(i + 1).padStart(2, '0')}.jpg`)
 const infoPath = `src/mission/${d.id}/info.json`
 const infoSha = await getSha(infoPath)
 const localImages = (d.images as { dataUrl: string; name: string }[]) || []
 for (let i = 0; i < localImages.length; i++) {
 const fn = `img-${String(i + 1).padStart(2, '0')}.jpg`
 const b64 = await dataUrlToBase64Async(localImages[i].dataUrl)
 const imgPath = `src/mission/${d.id}/${fn}`
 const imgSha = await getSha(imgPath)
 await commitBinary(envToken, settings.repoOwner, settings.repoName,
 imgPath, b64, `Add image ${fn}`, branch, imgSha)
 }
 const stats = (d.stats as { key: string; value: string }[]) || []
 await commitFile(envToken, settings.repoOwner, settings.repoName,
 infoPath,
 JSON.stringify({
 id: d.id, title: d.title, slug: d.id, tag: d.tag, date: d.date,
 description: d.description, detail: d.detail, images: filenames,
 stats: stats.reduce((a, { key, value }) => ({ ...a, [key]: value }), {}),
 partners: d.partners || [], show: d.show !== false,
 }, null, 2), `Update mission ${d.id}`, branch, infoSha)

 } else if (d.type === 'announcement') {
 const annImg = d.image as { dataUrl: string; remote?: boolean } | null
 if (annImg && !annImg.remote) {
 const imgName = `${d.id}-image.jpg`
 const b64 = await dataUrlToBase64Async(annImg.dataUrl)
 const imgPath = `src/announcements/assets/${imgName}`
 const imgSha = await getSha(imgPath)
 await commitBinary(envToken, settings.repoOwner, settings.repoName,
 imgPath, b64, `Add image ${imgName}`, branch, imgSha)
 }
 const annPath = `src/announcements/main/${d.id}.json`
 const annSha = await getSha(annPath)
 let oldParsed: Record<string, unknown> = {}
 try { const oldRaw = await (await fetch(`https://raw.githubusercontent.com/${settings.repoOwner}/${settings.repoName}/${settings.repoBranch}/${annPath}`)).text(); oldParsed = JSON.parse(oldRaw) } catch {}
 const ann: Record<string, unknown> = {
 id: d.id, title: d.title, tag: d.tag, date: d.date,
 summary: d.summary, description: d.description, active: d.active !== false,
 }
 for (const k of ['status', 'day', 'time', 'location', 'issuedBy', 'importance', 'instructions', 'deadline'] as const) {
 if (d[k] !== undefined && d[k] !== null && d[k] !== '') ann[k] = d[k]
 }
 if (annImg && !annImg.remote) ann.image = `/announcements/assets/${d.id}-image.jpg`
 if (oldParsed.image && !ann.image) ann.image = oldParsed.image
 if (oldParsed.tags) ann.tags = oldParsed.tags
 if (oldParsed.gallery) ann.gallery = oldParsed.gallery
 if (oldParsed.deadline && !ann.deadline) ann.deadline = oldParsed.deadline
 await commitFile(envToken, settings.repoOwner, settings.repoName,
 annPath, JSON.stringify(ann, null, 2), `Update announcement ${d.id}`, branch, annSha)

 } else if (d.type === 'members') {
 const memPath = 'src/info/members.json'
 const memSha = await getSha(memPath)
 await commitFile(envToken, settings.repoOwner, settings.repoName,
 memPath, JSON.stringify(d, null, 2), `Update members`, branch, memSha)
 }
 }

 const title = `Admin Update — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`

 const result = await createPR(envToken, settings.repoOwner, settings.repoName, title, prBody, branch, settings.repoBranch)
 const finalUrl = result.url
 const finalNumber = result.number
 setPrUrl(finalUrl)
 setPrNumber(finalNumber)
 setStep('done')

 savePublishRecord({
 id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
 date: new Date().toISOString(),
 prUrl: finalUrl,
 prNumber: finalNumber,
 commitMessage: commitMsg,
 files: diffs.map(d => ({ path: d.path, status: d.status }) as PublishFile),
 draftCount: drafts.length,
 fileCount: totalFiles,
 state: 'open',
 owner: settings.repoOwner,
 repo: settings.repoName,
 })

 for (const d of drafts) Storage.deleteDraft(d.type, d.id)
 } catch (e) {
 const msg = e instanceof Error ? e.message : 'Unknown error'
 setPubError(msg === 'No changes detected'
 ? 'No changes were detected.'
 : 'Could not publish changes. Please try again.')
 setStep('review')
 }
 }

 if (!open) return null

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
 <motion.div
 initial={{ opacity: 0, scale: 0.96 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
 className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-white dark:bg-zinc-950 __S2XL__ shadow-black/5 dark:shadow-black/5 dark:shadow-black/40"
 style={{ maxWidth: step === 'review' ? 720 : 440 }}
 onClick={e => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-200 dark:border-zinc-800/50 px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 dark:bg-white dark:bg-zinc-900">
 {step === 'done'
 ? <CheckCircleIcon size={18} className="text-emerald-600 dark:text-emerald-600 dark:text-emerald-400" />
 : <GitPullRequestIcon size={18} className="text-emerald-600 dark:text-emerald-600 dark:text-emerald-400" />
 }
 </div>
 <div>
 <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
 {step === 'verify' && 'Send Pull Request'}
 {step === 'review' && 'Review Changes'}
 {step === 'publishing' && 'Publishing...'}
 {step === 'done' && 'Sent!'}
 </h3>
 <p className="text-[11px] text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600">
 {step === 'verify' && `${drafts.length} draft${drafts.length !== 1 ? 's' : ''} · ${totalFiles} file${totalFiles !== 1 ? 's' : ''}`}
 {step === 'review' && (loadingDiffs ? 'Loading changes...' : `${diffs.length} file${diffs.length !== 1 ? 's' : ''} changed`)}
 {step === 'publishing' && 'This may take a moment'}
 {step === 'done' && 'Pull request created on GitHub'}
 </p>
 </div>
 </div>
 <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-400 dark:text-zinc-700 dark:hover:text-zinc-700 dark:text-zinc-300" onClick={onClose}>
 <XIcon size={16} />
 </button>
 </div>

 {/* Body */}
 <div className="p-4">
 {step === 'verify' && (
 <div>
 <div className="mb-4 flex gap-3 rounded-lg border border-zinc-200/30 dark:border-zinc-800/30 dark:border-zinc-200 dark:border-zinc-800/30 bg-zinc-50/30 dark:bg-zinc-50/30 dark:bg-zinc-900/20 p-3">
 <LockIcon size={18} className="mt-0.5 shrink-0 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600" />
 <div>
 <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 dark:text-zinc-600 dark:text-zinc-400">Verification Code</div>
 <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600">Only authorized club members can publish changes to the live site.</p>
 </div>
 </div>
 {pubError && (
 <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-50 dark:bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-600 dark:text-red-400">
 <AlertTriangleIcon size={13} /> {pubError}
 </div>
 )}
 <label className="mb-1.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-500">Verification Code</label>
 <input value={code} onChange={e => { setCode(e.target.value); setCodeErr(''); setPubError('') }}
 onKeyDown={e => e.key === 'Enter' && handleVerify()}
 placeholder="Enter code..."
 autoFocus
 className={`w-full rounded-lg border bg-zinc-50 dark:bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2.5 text-center text-sm font-semibold tracking-widest text-zinc-900 dark:text-white outline-none placeholder:text-zinc-700 dark:text-zinc-300 dark:placeholder:text-zinc-400 dark:text-zinc-700 focus:border-emerald-500/50 ${
 codeErr ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-200 dark:border-zinc-800'
 }`}
 />
 {codeErr && (
 <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-600 dark:text-red-400">
 <AlertTriangleIcon size={12} /> {codeErr}
 </div>
 )}
 <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-emerald-500 dark:hover:bg-emerald-400" onClick={handleVerify}>
 <GitPullRequestIcon size={15} /> Review Changes
 </button>
 </div>
 )}

 {step === 'review' && (
 loadingDiffs ? (
 <div className="py-8 text-center">
 <LoaderIcon size={22} className="mx-auto animate-spin text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600" />
 <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600">Loading current files from GitHub...</p>
 </div>
 ) : (
 <DiffView
 diffs={diffs}
 commitMessage={commitMsg}
 onCommitMessageChange={setCommitMsg}
 onPublish={handlePublish}
 publishing={false}
 />
 )
 )}

 {step === 'publishing' && (
 <div className="py-6 text-center">
 <LoaderIcon size={24} className="mx-auto animate-spin text-emerald-600 dark:text-emerald-600 dark:text-emerald-400" />
 <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">Publishing...</p>
 <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600">Committing changes and creating pull request on GitHub</p>
 </div>
 )}

 {step === 'done' && (
 <div className="py-4 text-center">
 <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-100 dark:bg-emerald-500/15">
 <CheckCircleIcon size={28} className="text-emerald-600 dark:text-emerald-600 dark:text-emerald-400" />
 </div>
 <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Pull Request Sent!</h3>
 <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-600">
 Submitted to {settings.repoOwner}/{settings.repoName}
 </p>
 <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-700">
 {drafts.length} draft{drafts.length !== 1 ? 's' : ''} · {totalFiles} file{totalFiles !== 1 ? 's' : ''}
 </p>
 <div className="mt-6 flex flex-col gap-2">
 <a href={prUrl} target="_blank" rel="noopener noreferrer"
 className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-emerald-500 dark:hover:bg-emerald-400">
 <ExternalLinkIcon size={15} /> View Pull Request
 </a>
 <button className="rounded-lg border border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-200/50 dark:bg-zinc-800/50 hover:text-zinc-400 dark:text-zinc-700 dark:hover:text-zinc-700 dark:text-zinc-300" onClick={onClose}>
 Close
 </button>
 </div>
 </div>
 )}
 </div>
 </motion.div>
 </div>
 )
}
