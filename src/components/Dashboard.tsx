import { useEffect, useState } from 'react'
import { useStore, getDrafts } from '../store'
import { Storage } from '../utils/storage'
import {
  TargetIcon, MegaphoneIcon, UsersIcon, FileTextIcon,
  PlusIcon, ArrowRightIcon, GitPullRequestIcon, TrashIcon
} from './Icons'

export function Dashboard() {
  const missions = useStore(s => s.missions)
  const announcements = useStore(s => s.announcements)
  const members = useStore(s => s.members)
  const setMissions = useStore(s => s.setMissions)
  const setAnnouncements = useStore(s => s.setAnnouncements)
  const setMembers = useStore(s => s.setMembers)
  const addToast = useStore(s => s.addToast)
  const setView = useStore(s => s.setView)
  const setPrOpen = useStore(s => s.setPrOpen)
  const setPendingDraftId = useStore(s => s.setPendingDraftId)
  const refreshTrigger = useStore(s => s.refreshTrigger)

  const drafts = getDrafts()
  const [liveStats, setLiveStats] = useState({ missions: '...', announcements: '...', members: '...' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    async function load() {
      const s = Storage.getSettings()
      const B = `https://raw.githubusercontent.com/${s.repoOwner}/${s.repoName}/${s.repoBranch}`
      try {
        const [mRes, aRes, memRes] = await Promise.allSettled([
          fetch(B + '/src/mission/list.json'),
          fetch(B + '/src/announcements/list.json'),
          fetch(B + '/src/info/members.json'),
        ])
        if (mRes.status === 'fulfilled') {
          const d = await mRes.value.json()
          setMissions(d.missions || [])
          setLiveStats(p => ({ ...p, missions: String((d.missions || []).filter((m: { show?: boolean }) => m.show !== false).length) }))
        }
        if (aRes.status === 'fulfilled') {
          const d = await aRes.value.json()
          setAnnouncements(Array.isArray(d) ? d : [])
          setLiveStats(p => ({ ...p, announcements: String((Array.isArray(d) ? d : []).filter((a: { active?: boolean }) => a.active !== false).length) }))
        }
        if (memRes.status === 'fulfilled') {
          const d = await memRes.value.json()
          setMembers(d)
          const total = d.stats?.total || (d.teachers?.length || 0) + (d.core?.length || 0) + (d.general?.length || 0)
          setLiveStats(p => ({ ...p, members: String(total) }))
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [refreshTrigger])

  const mCount = missions.filter(m => m.show !== false).length || liveStats.missions
  const aCount = announcements.filter(a => a.active !== false).length || liveStats.announcements
  const memCount = members
    ? (members.stats?.total || members.general.length + members.core.length + members.teachers.length)
    : liveStats.members

  const cards = [
    { icon: <TargetIcon size={20} />, color: 'var(--blue)', bg: 'var(--blue-light)', value: mCount, label: 'Active Missions' },
    { icon: <MegaphoneIcon size={20} />, color: 'var(--amber)', bg: 'var(--amber-light)', value: aCount, label: 'Active Announcements' },
    { icon: <UsersIcon size={20} />, color: 'var(--accent-dark)', bg: 'var(--accent-light)', value: memCount, label: 'Total Members' },
    { icon: <FileTextIcon size={20} />, color: 'var(--purple)', bg: 'var(--purple-light)', value: drafts.length, label: 'Saved Drafts' },
  ]

  const quick = [
    { icon: <TargetIcon size={22} />, title: 'Create Mission', desc: 'Add a new mission with unlimited images', view: 'missions' as const, color: 'var(--blue)', bg: 'var(--blue-light)' },
    { icon: <MegaphoneIcon size={22} />, title: 'Create Announcement', desc: 'Post a club notice or update', view: 'announcements' as const, color: 'var(--amber)', bg: 'var(--amber-light)' },
    { icon: <UsersIcon size={22} />, title: 'Edit Members', desc: 'Update teacher, core & general members', view: 'members' as const, color: 'var(--accent-dark)', bg: 'var(--accent-light)' },
  ]

  if (loading) {
    return (
      <div className="page-enter">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-stat" />)}
        </div>
        <div style={{ marginBottom: 24 }}>
          <div className="skeleton skeleton-text short" style={{ marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card-sm" />)}
          </div>
        </div>
        <div className="skeleton skeleton-card" />
      </div>
    )
  }

  return (
    <div>
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusIcon size={16} /> Quick Actions
        </h2>
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          {quick.map((item, i) => (
            <div key={i} className="card" style={{ cursor: 'pointer', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}
              onClick={() => setView(item.view)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
              <ArrowRightIcon size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextIcon size={16} style={{ color: 'var(--amber)' }} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>Saved Drafts</span>
          </div>
          <span className="badge badge-warning">{drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}</span>
        </div>
        <div style={{ padding: 8 }}>
          {drafts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">No saved drafts yet</div>
              <div className="empty-state-desc">Create content and save your progress!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {drafts.map(d => (
                <div key={d.id} className="draft-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span className={`badge badge-${d.type === 'mission' ? 'info' : d.type === 'announcement' ? 'warning' : 'success'}`}>{d.type}</span>
                      <span>{new Date(d.updated).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setPendingDraftId(d.id); setView('draftDiff') }}>Open</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => { Storage.deleteDraft(d.type, d.id); addToast('Draft deleted', 'info') }}>
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: 'var(--radius-md)',
        padding: '24px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitPullRequestIcon size={22} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>GitHub Pull Request</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Publish your changes to the live site.</div>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setPrOpen(true)}>
          <GitPullRequestIcon size={16} /> Send Pull Request
        </button>
      </div>
    </div>
  )
}
