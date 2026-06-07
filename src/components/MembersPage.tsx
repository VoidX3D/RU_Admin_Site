import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import type { Member, MembersData } from '../types'
import { UsersIcon, PlusIcon, XIcon, RefreshIcon, SaveIcon } from './Icons'

type Tab = 'teachers' | 'core' | 'general'

function getBase(path = '') {
  const s = Storage.getSettings()
  return `https://raw.githubusercontent.com/${s.repoOwner}/${s.repoName}/${s.repoBranch}/${path}`
}

export function MembersPage() {
  const addToast = useStore(s => s.addToast)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('core')
  const [teachers, setTeachers] = useState<Member[]>([])
  const [core, setCore] = useState<Member[]>([])
  const [general, setGeneral] = useState<Member[]>([])

  useEffect(() => { load() }, [refreshTrigger])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(getBase('src/info/members.json'))
      const d: MembersData = await r.json()
      setTeachers(d.teachers || []); setCore(d.core || []); setGeneral(d.general || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  function addMember() {
    const m: Member = { name: '', class: '', role: 'General Member' }
    if (tab === 'teachers') setTeachers(p => [...p, { ...m, role: 'Advisor', type: 'advisor' }])
    else if (tab === 'core') setCore(p => [...p, { ...m, role: 'Coordinator', type: 'coord' }])
    else setGeneral(p => [...p, m])
  }

  function upd(idx: number, field: keyof Member, val: string) {
    const fn = (arr: Member[], set: (v: Member[]) => void) => set(arr.map((m, i) => i === idx ? { ...m, [field]: val } : m))
    if (tab === 'teachers') fn(teachers, setTeachers)
    else if (tab === 'core') fn(core, setCore)
    else fn(general, setGeneral)
  }

  function remove(idx: number) {
    if (tab === 'teachers') setTeachers(p => p.filter((_, i) => i !== idx))
    else if (tab === 'core') setCore(p => p.filter((_, i) => i !== idx))
    else setGeneral(p => p.filter((_, i) => i !== idx))
  }

  function saveDraft() {
    const data: MembersData = {
      teachers: teachers.filter(t => t.name.trim()),
      core: core.filter(c => c.name.trim()),
      general: general.filter(g => g.name.trim()),
      stats: { teachers: 0, core: 0, general: 0, total: 0 },
    }
    data.stats.teachers = data.teachers.length
    data.stats.core = data.core.length
    data.stats.general = data.general.length
    data.stats.total = data.teachers.length + data.core.length + data.general.length
    Storage.saveDraft('members', 'members', data as unknown as Record<string, unknown>)
    addToast('Members draft saved!', 'success')
  }

  const current = tab === 'teachers' ? teachers : tab === 'core' ? core : general
  const counts = { teachers: teachers.length, core: core.length, general: general.length }
  const total = teachers.length + core.length + general.length

  const TABS: { key: Tab; label: string }[] = [
    { key: 'teachers', label: 'Teachers' },
    { key: 'core', label: 'Core Team' },
    { key: 'general', label: 'General' },
  ]

  if (loading) {
    return (
      <div className="page-enter">
        <div className="skeleton-header">
          <div className="skeleton-header-left">
            <div className="skeleton skeleton-text" style={{ width: 120 }} />
            <div className="skeleton skeleton-text short" />
          </div>
          <div className="skeleton-header-right">
            <div className="skeleton skeleton-button" />
            <div className="skeleton skeleton-button" />
          </div>
        </div>
        <div className="field-group field-group-4" style={{ marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-stat" />)}
        </div>
        <div className="skeleton skeleton-card" style={{ height: 200 }} />
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Members</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Edit teachers, core team, and general members</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshIcon size={14} /> Refresh</button>
          <button className="btn" style={{ background: 'var(--amber)', color: '#fff' }} onClick={saveDraft}>
            <SaveIcon size={14} /> Save Draft
          </button>
        </div>
      </div>

      <div className="field-group field-group-4" style={{ marginBottom: 24 }}>
        {[
          { count: teachers.length, label: 'Teachers', color: 'var(--purple)' },
          { count: core.length, label: 'Core Team', color: 'var(--blue)' },
          { count: general.length, label: 'General', color: 'var(--accent)' },
          { count: total, label: 'Total', color: 'var(--text)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ textAlign: 'center', padding: 16 }}>
            <div className="stat-value" style={{ color: s.color }}>{s.count}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            <span className="badge" style={{ background: tab === t.key ? 'var(--accent-glow)' : 'var(--border)', color: tab === t.key ? 'var(--accent-dark)' : 'var(--text-tertiary)', marginLeft: 4 }}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="card"><div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UsersIcon size={18} style={{ color: 'var(--blue)' }} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>{tab === 'core' ? 'Core Team' : tab === 'teachers' ? 'Teachers' : 'General Members'}</span>
            <span className="badge" style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>{current.length}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={addMember}><PlusIcon size={14} /> Add Member</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="member-row">
                <div className="skeleton skeleton-avatar" />
                <div className="member-fields">
                  <div><div className="skeleton skeleton-text" /></div>
                  <div><div className="skeleton skeleton-text short" /></div>
                  <div><div className="skeleton skeleton-text" /></div>
                  {tab !== 'general' && <div><div className="skeleton skeleton-text short" /></div>}
                </div>
                <div className="skeleton skeleton-button" />
              </div>
            ))}
          </div>
        ) : current.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
            <div className="empty-state-icon"><UsersIcon size={40} /></div>
            <div className="empty-state-title">No {tab} members yet</div>
            <div className="empty-state-desc">Click "Add Member" to create one.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {current.map((m, i) => (
              <div key={i} className="member-row">
                <div className="member-avatar">{m.name.charAt(0).toUpperCase() || '?'}</div>
                <div className="member-fields">
                  <div>
                    <label className="label">Name</label>
                    <input value={m.name} onChange={e => upd(i, 'name', e.target.value)} placeholder="Full name" className="input" />
                  </div>
                  {tab !== 'teachers' && (
                    <div>
                      <label className="label">Class</label>
                      <input value={m.class || ''} onChange={e => upd(i, 'class', e.target.value)} placeholder="8A" className="input" />
                    </div>
                  )}
                  <div>
                    <label className="label">Role</label>
                    <input value={m.role} onChange={e => upd(i, 'role', e.target.value)} placeholder="Role" className="input" />
                  </div>
                  {tab !== 'general' && (
                    <div>
                      <label className="label">Type</label>
                      <select value={m.type || ''} onChange={e => upd(i, 'type', e.target.value)} className="input">
                        {tab === 'teachers' ? (
                          <><option value="patron">Patron</option><option value="advisor">Advisor</option></>
                        ) : (
                          <option value="coord">Coordinator</option>
                        )}
                      </select>
                    </div>
                  )}
                </div>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(i)}><XIcon size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div></div>
    </div>
  )
}
