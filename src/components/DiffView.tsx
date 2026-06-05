import { useState } from 'react'
import type { FileDiff, DiffLine } from '../utils/diff'
import { FileTextIcon, ImageIcon, ChevronDownIcon, XIcon } from './Icons'

function FullFileView({ title, content, lang }: { title: string; content: string; lang: string }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-light)' }}>
      <div style={{
        padding: '6px 12px', fontSize: 11, fontWeight: 600,
        color: 'var(--text-tertiary)', background: 'var(--surface-hover)',
        borderBottom: '1px solid var(--border-light)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {title}
      </div>
      <pre style={{
        margin: 0, padding: 12, fontSize: 11, lineHeight: 1.5,
        fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre',
        maxHeight: 320, overflowY: 'auto', color: 'var(--text-secondary)',
      }}>
        {content || '(empty)'}
      </pre>
    </div>
  )
}

function DiffLines({ lines }: { lines: DiffLine[] }) {
  if (lines.length === 0) return null

  return (
    <div style={{
      fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5,
      overflowX: 'auto', maxHeight: 360, overflowY: 'auto',
      borderTop: '1px solid var(--border)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
        <tbody>
          {lines.map((line, i) => {
            const bg = line.type === 'add' ? 'rgba(34,197,94,0.08)'
              : line.type === 'del' ? 'rgba(239,68,68,0.08)'
              : 'transparent'
            const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '
            const color = line.type === 'add' ? 'var(--accent-dark)'
              : line.type === 'del' ? 'var(--red)' : 'var(--text-tertiary)'
            return (
              <tr key={i} style={{ background: bg }}>
                <td style={{
                  width: 36, textAlign: 'right', padding: '0 6px',
                  color: 'var(--text-tertiary)', userSelect: 'none',
                  borderRight: '1px solid var(--border-light)',
                  fontSize: 11,
                }}>
                  {line.oldLine !== null ? line.oldLine : ''}
                </td>
                <td style={{
                  width: 36, textAlign: 'right', padding: '0 6px',
                  color: 'var(--text-tertiary)', userSelect: 'none',
                  borderRight: '1px solid var(--border-light)',
                  fontSize: 11,
                }}>
                  {line.newLine !== null ? line.newLine : ''}
                </td>
                <td style={{ padding: '0 12px', color, whiteSpace: 'pre' }}>
                  <span style={{ userSelect: 'none', width: 16, display: 'inline-block' }}>{prefix}</span>
                  {line.text || ' '}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function FileModal({ diff, onClose }: { diff: FileDiff; onClose: () => void }) {
  const [tab, setTab] = useState<'before' | 'after'>('before')
  return (
    <div className="modal-overlay" onClick={onClose} style={{ animation: 'fadeIn 0.15s ease', zIndex: 1000 }}>
      <div className="modal wide" style={{ maxWidth: 720, maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            {diff.path}
          </span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><XIcon size={18} /></button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button className={`btn ${tab === 'before' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, flex: 1, fontSize: 12 }}
            onClick={() => setTab('before')}>
            Before
          </button>
          <button className={`btn ${tab === 'after' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, flex: 1, fontSize: 12 }}
            onClick={() => setTab('after')}>
            After
          </button>
        </div>
        <div style={{ maxHeight: 'calc(80vh - 100px)', overflow: 'auto' }}>
          <pre style={{
            margin: 0, padding: 16, fontSize: 11, lineHeight: 1.5,
            fontFamily: 'monospace', whiteSpace: 'pre', overflowX: 'auto',
            color: 'var(--text-secondary)',
          }}>
            {tab === 'before' ? (diff.oldContent || '(empty - new file)') : diff.newContent}
          </pre>
        </div>
      </div>
    </div>
  )
}

function FileEntry({ diff, defaultOpen }: { diff: FileDiff; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [view, setView] = useState<'diff' | 'before' | 'after'>('diff')
  const [showModal, setShowModal] = useState(false)
  const isJson = diff.path.endsWith('.json')
  const isImage = diff.path.endsWith('.jpg') || diff.path.endsWith('.png') || diff.path.endsWith('.webp')
  const changeColor = diff.status === 'added' ? 'var(--accent-dark)' : 'var(--amber)'
  const changeLabel = diff.status === 'added' ? 'A' : 'M'

  return (
    <div style={{ borderBottom: '1px solid var(--border-light)' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', cursor: 'pointer',
          background: open ? 'var(--surface-hover)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, flexShrink: 0,
          background: changeColor + '18',
          color: changeColor,
          border: '1px solid ' + changeColor + '30',
        }}>
          {changeLabel}
        </div>
        {isImage ? <ImageIcon size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} /> : <FileTextIcon size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
        <span style={{ fontSize: 12, fontFamily: 'monospace', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {diff.path}
        </span>
        {!isImage && isJson && (
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '2px 6px' }}
            onClick={e => { e.stopPropagation(); setShowModal(true) }}>
            Open
          </button>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
          color: 'var(--text-tertiary)',
        }}>
          <ChevronDownIcon size={14} />
        </div>
      </div>
      {open && (
        isImage ? (
          <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            New image added
          </div>
        ) : isJson ? (
          <div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {(['diff', 'before', 'after'] as const).map(t => (
                <button key={t} className={`btn ${view === t ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 0, flex: 1, fontSize: 11, padding: '6px 8px' }}
                  onClick={() => setView(t)}>
                  {t === 'diff' ? 'Diff' : t === 'before' ? 'Before' : 'After'}
                </button>
              ))}
            </div>
            {view === 'diff' && (
              diff.lines.length > 0 ? <DiffLines lines={diff.lines} />
              : <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No changes detected</div>
            )}
            {view === 'before' && <FullFileView title="Original" content={diff.oldContent || '(empty)'} lang="json" />}
            {view === 'after' && <FullFileView title="Modified" content={diff.newContent} lang="json" />}
          </div>
        ) : (
          <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No changes detected
          </div>
        )
      )}
      {showModal && <FileModal diff={diff} onClose={() => setShowModal(false)} />}
    </div>
  )
}

interface Props {
  diffs: FileDiff[]
  commitMessage: string
  onCommitMessageChange: (msg: string) => void
  onPublish: () => void
  publishing: boolean
}

export function DiffView({ diffs, commitMessage, onCommitMessageChange, onPublish, publishing }: Props) {
  const added = diffs.filter(d => d.status === 'added').length
  const modified = diffs.filter(d => d.status === 'modified').length
  const totalChanges = diffs.reduce((s, d) => s + (d.status === 'added' ? 1 : d.lines.filter(l => l.type !== 'same').length), 0)

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Review Changes</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', gap: 8 }}>
            {modified > 0 && <span><strong style={{ color: 'var(--amber)' }}>{modified}</strong> modified</span>}
            {added > 0 && <span><strong style={{ color: 'var(--accent-dark)' }}>{added}</strong> added</span>}
            <span><strong>{totalChanges}</strong> line{totalChanges !== 1 ? 's' : ''} changed</span>
          </div>
        </div>
        <div style={{ maxHeight: 480, overflowY: 'auto', borderBottom: '1px solid var(--border)' }}>
          {diffs.map((d, i) => (
            <FileEntry key={d.path} diff={d} defaultOpen={i < 2 && d.lines.length > 0} />
          ))}
        </div>
      </div>

      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="form-card-body" style={{ padding: '16px 20px' }}>
          <label className="label">Commit Message</label>
          <textarea
            value={commitMessage}
            onChange={e => onCommitMessageChange(e.target.value)}
            placeholder="Describe what changed..."
            className="input"
            style={{
              minHeight: 80, fontSize: 13, fontFamily: 'monospace',
              lineHeight: 1.5, resize: 'vertical', width: '100%', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={onPublish} disabled={publishing}>
        {publishing ? 'Publishing...' : `Commit & Send Pull Request`}
      </button>
    </div>
  )
}