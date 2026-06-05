import { useState, useEffect } from 'react'
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
import { GitPullRequestIcon, CheckCircleIcon, AlertTriangleIcon, XIcon, LoaderIcon } from './Icons'

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
        } catch {
          return null
        }
      }

      const fileDiffs = await prepareFileDiffs(drafts, fetchCurrent)
      setDiffs(fileDiffs)
      const defaultMsg = `Update ${fileDiffs.map(d => d.path.split('/').pop()).filter(Boolean).join(', ')}`
      setCommitMsg(defaultMsg)
    } catch (e) {
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

      // Create a unique branch for this publish session
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
    <div className="modal-overlay" onClick={onClose} style={{ animation: 'fadeIn 0.15s ease' }}>
      <div className="modal wide" style={{ maxWidth: step === 'review' ? 800 : step === 'publishing' ? 420 : 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {step === 'done'
                ? <CheckCircleIcon size={18} style={{ color: '#22c55e' }} />
                : <GitPullRequestIcon size={18} style={{ color: '#22c55e' }} />
              }
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15 }}>
                {step === 'verify' && 'Send Pull Request'}
                {step === 'review' && 'Review Changes'}
                {step === 'publishing' && 'Publishing...'}
                {step === 'done' && 'Sent!'}
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
                {step === 'verify' && `${drafts.length} draft${drafts.length !== 1 ? 's' : ''} · ${totalFiles} file${totalFiles !== 1 ? 's' : ''}`}
                {step === 'review' && loadingDiffs ? 'Loading changes...' : `${diffs.length} file${diffs.length !== 1 ? 's' : ''} changed`}
                {step === 'publishing' && 'This may take a moment'}
                {step === 'done' && 'Pull request created on GitHub'}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><XIcon size={18} /></button>
        </div>

        <div className="modal-body" style={{ animation: 'pageIn 0.2s ease' }}>
          {step === 'verify' && (
            <div>
              <div className="step-card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>🔐</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 14 }}>Enter Verification Code</div>
                    <p style={{ fontSize: 13, margin: 0 }}>Only authorized club members can publish changes to the live site.</p>
                  </div>
                </div>
              </div>
              {pubError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'var(--red-glow)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
                  <AlertTriangleIcon size={14} /> {pubError}
                </div>
              )}
              <label className="label">Verification Code</label>
              <input value={code} onChange={e => { setCode(e.target.value); setCodeErr(''); setPubError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="Enter code..." autoFocus
                className="input" style={{
                  marginBottom: codeErr ? 8 : 20,
                  borderColor: codeErr ? 'var(--red)' : '',
                  fontSize: 16, letterSpacing: '0.1em', fontWeight: 600,
                  textAlign: 'center',
                }} />
              {codeErr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
                  <AlertTriangleIcon size={14} /> {codeErr}
                </div>
              )}
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleVerify}>
                <GitPullRequestIcon size={16} /> Review Changes
              </button>
            </div>
          )}

          {step === 'review' && (
            loadingDiffs ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <LoaderIcon size={24} style={{ animation: 'spin 0.6s linear infinite', color: 'var(--text-tertiary)' }} />
                <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 14 }}>Loading current files from GitHub...</p>
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
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div className="spinner spinner-lg" style={{ margin: '0 auto 20px', borderTopColor: 'var(--accent)' }} />
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Publishing...</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Committing changes and creating pull request on GitHub
              </p>
            </div>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 56, height: 56,
                background: 'linear-gradient(135deg, var(--accent-light), #bbf7d0)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                animation: 'scaleIn 0.3s ease',
              }}>
                <CheckCircleIcon size={28} style={{ color: 'var(--accent-dark)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Pull Request Sent!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>
                Submitted to {settings.repoOwner}/{settings.repoName}
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 24 }}>
                {drafts.length} draft{drafts.length !== 1 ? 's' : ''} · {totalFiles} file{totalFiles !== 1 ? 's' : ''}
              </p>
              <a href={prUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                style={{ textDecoration: 'none', display: 'inline-flex', boxShadow: '0 4px 14px var(--accent-glow)' }}>
                <GitPullRequestIcon size={16} /> View Pull Request
              </a>
              <button className="btn btn-secondary btn-lg" style={{ display: 'block', width: '100%', marginTop: 10 }} onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
